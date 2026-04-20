import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysDbUpdateEntity } from './db-update.entity';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class DbUpdaterService implements OnModuleInit {
  private readonly logger = new Logger(DbUpdaterService.name);

  constructor(
    @InjectRepository(SysDbUpdateEntity)
    private readonly dbUpdateRepo: Repository<SysDbUpdateEntity>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Wait slightly to ensure TypeORM is fully synced if needed
    setTimeout(() => {
      this.runPendingUpdates().catch(e => this.logger.error('Error running pending DB updates', e));
    }, 2000);
  }

  async runPendingUpdates() {
    const dbDir = path.resolve(process.cwd(), 'db');
    if (!fs.existsSync(dbDir)) {
      this.logger.warn(`Database directory not found at: ${dbDir}`);
      return;
    }

    const files = fs.readdirSync(dbDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Execute in alphabetical order

    const dbConfig = this.configService.get('db.mysql');

    for (const file of files) {
      try {
        const existing = await this.dbUpdateRepo.findOne({ where: { filename: file } });
        if (existing && existing.status === 'SUCCESS') {
          continue;
        }

        this.logger.log(`Executing new SQL file: ${file}`);
        const filePath = path.join(dbDir, file);
        
        // Escape special chars in password if needed, but for raw execution this is standard
        const cmd = `mysql --default-character-set=utf8mb4 -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.username} -p"${dbConfig.password}" ${dbConfig.database} < "${filePath}"`;
        await execAsync(cmd);
        
        const record = existing || new SysDbUpdateEntity();
        record.filename = file;
        record.status = 'SUCCESS';
        record.errorMsg = null;
        record.executedAt = new Date();
        await this.dbUpdateRepo.save(record);
        this.logger.log(`Successfully executed ${file}`);
      } catch (error) {
        this.logger.error(`Failed to execute ${file}`, error.message);
        
        const existing = await this.dbUpdateRepo.findOne({ where: { filename: file } });
        const record = existing || new SysDbUpdateEntity();
        record.filename = file;
        record.status = 'FAILED';
        record.errorMsg = error.message;
        record.executedAt = new Date();
        await this.dbUpdateRepo.save(record);
      }
    }
  }
}
