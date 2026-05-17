import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysDbUpdateEntity } from './db-update.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DbUpdaterService implements OnModuleInit {
  private readonly logger = new Logger(DbUpdaterService.name);

  constructor(
    @InjectRepository(SysDbUpdateEntity)
    private readonly dbUpdateRep: Repository<SysDbUpdateEntity>,
  ) {}

  async onModuleInit() {
    // 延迟执行，确保数据库连接已就绪
    setTimeout(() => {
      this.runPendingMigrations().catch(err => {
        this.logger.error(`数据库自动升级失败: ${err.message}`);
      });
    }, 3000);
  }

  /**
   * 执行所有待处理的 SQL 迁移脚本
   */
  async runPendingMigrations(): Promise<void> {
    // 先确保 sys_db_updates 表存在
    await this.ensureRecordTable();

    const dbDir = this.resolveDbDir();
    if (!fs.existsSync(dbDir)) {
      this.logger.warn(`数据库脚本目录不存在: ${dbDir}，跳过自动升级`);
      return;
    }

    const files = fs.readdirSync(dbDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // 按文件名排序执行

    if (files.length === 0) {
      this.logger.log('未发现待执行的 SQL 脚本');
      return;
    }

    // 查询已执行的脚本
    const executed = await this.dbUpdateRep.find({
      where: { status: 'success' },
    });
    const executedNames = new Set(executed.map(e => e.filename));

    let executedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      if (executedNames.has(file)) {
        skippedCount++;
        continue;
      }

      const filePath = path.posix.join(dbDir, file);
      this.logger.log(`执行数据库脚本: ${file}`);

      const record = this.dbUpdateRep.create({
        filename: file,
        status: 'running',
        executedAt: new Date(),
      });

      try {
        const sqlContent = fs.readFileSync(filePath, 'utf-8');
        await this.executeSql(sqlContent);

        record.status = 'success';
        await this.dbUpdateRep.save(record);
        executedCount++;
        this.logger.log(`数据库脚本 ${file} 执行成功`);
      } catch (error) {
        record.status = 'failed';
        record.errorMsg = error.message?.substring(0, 500) || 'Unknown error';
        await this.dbUpdateRep.save(record).catch(() => {});
        this.logger.error(`数据库脚本 ${file} 执行失败: ${error.message}`);
        // 失败后停止执行后续脚本，避免连锁错误
        throw error;
      }
    }

    this.logger.log(`数据库自动升级完成: 执行 ${executedCount} 个, 跳过 ${skippedCount} 个`);
  }

  /**
   * 确保记录表存在
   */
  private async ensureRecordTable(): Promise<void> {
    try {
      await this.dbUpdateRep.count();
    } catch {
      // 表不存在，创建
      const createSql = `
        CREATE TABLE IF NOT EXISTS sys_db_updates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          error_msg TEXT NULL,
          executed_at DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据库升级记录表'
      `;
      try {
        await this.dbUpdateRep.query(createSql);
        this.logger.log('已创建数据库升级记录表 sys_db_updates');
      } catch (e) {
        this.logger.warn(`创建记录表失败（可能已存在）: ${e.message}`);
      }
    }
  }

  /**
   * 执行 SQL（支持多语句）
   */
  private async executeSql(sql: string): Promise<void> {
    // 先移除所有注释行和块注释，再按分号拆分
    const cleanSql = sql
      .replace(/--[^\n]*/g, '')       // 移除单行注释
      .replace(/\/\*[\s\S]*?\*\//g, ''); // 移除块注释
    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await this.dbUpdateRep.query(stmt);
      } catch (error) {
        this.logger.warn(`SQL 语句执行警告: ${error.message} (语句: ${stmt.substring(0, 80)}...)`);
        // 忽略常见的"已存在"类错误，继续执行
        if (
          !error.message?.includes('already exists') &&
          !error.message?.includes('Duplicate') &&
          !error.message?.includes('ER_DUP')
        ) {
          throw error;
        }
      }
    }
  }

  /**
   * 解析 db 目录的绝对路径
   */
  private resolveDbDir(): string {
    // 尝试多个可能的路径
    const candidates = [
      path.posix.resolve(process.cwd(), 'db'),                    // server/db (开发环境)
      path.posix.resolve(process.cwd(), '..', 'db'),              // dist/apps/xxx -> server/db
      path.posix.resolve(process.cwd(), '..', '..', 'db'),        // dist/apps/xxx/src -> server/db
      path.posix.resolve(process.cwd(), '..', '..', '..', 'db'),  // 更深的嵌套
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        this.logger.log(`数据库脚本目录: ${candidate}`);
        return candidate;
      }
    }

    // 默认返回 server/db
    return path.posix.resolve(process.cwd(), '..', 'db');
  }
}
