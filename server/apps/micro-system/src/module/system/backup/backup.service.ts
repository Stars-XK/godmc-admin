import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { ConfigService as SysConfigService } from '../config/config.service';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import dayjs from 'dayjs';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly nestConfig: NestConfigService,
    private readonly sysConfig: SysConfigService,
  ) {}

  private async getBackupPath(): Promise<string> {
    const defaultPath = '../upload/backups';
    let configuredPath = await this.sysConfig.getConfigValue('sys.backup.path');
    if (!configuredPath) configuredPath = defaultPath;
    
    const absolutePath = path.resolve(process.cwd(), configuredPath);
    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true });
    }
    return absolutePath;
  }

  async createBackup() {
    const dbConfig = this.nestConfig.get('db.mysql');
    const backupDir = await this.getBackupPath();
    const filename = `backup_${dayjs().format('YYYYMMDD_HHmmss')}.sql`;
    const filepath = path.join(backupDir, filename);

    try {
      const env = { ...process.env, MYSQL_PWD: dbConfig.password };
      const cmd = `mysqldump -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.username} ${dbConfig.database} > "${filepath}"`;
      
      await execAsync(cmd, { env });
      this.logger.log(`Backup created successfully: ${filepath}`);
      await this.cleanupOldBackups(backupDir);
      return { filename, path: filepath, size: fs.statSync(filepath).size };
    } catch (error: any) {
      this.logger.error('Backup failed', error.message);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  async restoreBackup(filename: string) {
    const dbConfig = this.nestConfig.get('db.mysql');
    const backupDir = await this.getBackupPath();
    const filepath = path.join(backupDir, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error('Backup file not found');
    }

    try {
      const env = { ...process.env, MYSQL_PWD: dbConfig.password };
      const cmd = `mysql -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.username} ${dbConfig.database} < "${filepath}"`;
      
      await execAsync(cmd, { env });
      this.logger.log(`Restore completed from: ${filepath}`);
      return true;
    } catch (error: any) {
      this.logger.error('Restore failed', error.message);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  async listBackups() {
    const backupDir = await this.getBackupPath();
    const files = fs.readdirSync(backupDir).filter((f: string) => f.endsWith('.sql'));
    
    return files.map((filename: string) => {
      const stats = fs.statSync(path.join(backupDir, filename));
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime
      };
    }).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteBackup(filename: string) {
    const backupDir = await this.getBackupPath();
    const filepath = path.join(backupDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    return true;
  }

  private async cleanupOldBackups(backupDir: string) {
    const limitStr = await this.sysConfig.getConfigValue('sys.backup.limit');
    const limit = parseInt(limitStr || '30', 10);
    
    const files = fs.readdirSync(backupDir)
      .filter((f: string) => f.endsWith('.sql'))
      .map((name: string) => ({
        name,
        time: fs.statSync(path.join(backupDir, name)).birthtime.getTime()
      }))
      .sort((a: any, b: any) => b.time - a.time);

    if (files.length > limit) {
      const toDelete = files.slice(limit);
      for (const file of toDelete) {
        fs.unlinkSync(path.join(backupDir, file.name));
        this.logger.log(`Auto-cleaned old backup: ${file.name}`);
      }
    }
  }
}
