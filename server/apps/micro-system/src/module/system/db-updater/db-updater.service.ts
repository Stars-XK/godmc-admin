import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
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
    private readonly dbUpdateRepo: Repository<SysDbUpdateEntity>,
  ) {}

  async onModuleInit() {
    // Wait slightly to ensure TypeORM is fully synced if needed
    setTimeout(() => {
      this.runPendingUpdates().catch(e => this.logger.error('Error running pending DB updates', e));
    }, 2000);
  }

  async runPendingUpdates() {
    let dbDir = path.resolve(process.cwd(), 'db');
    if (!fs.existsSync(dbDir)) {
      const altDir = path.resolve(process.cwd(), 'server', 'db');
      if (fs.existsSync(altDir)) {
        dbDir = altDir;
      } else {
        this.logger.warn(`Database directory not found at: ${dbDir}`);
        return;
      }
    }

    const files = fs.readdirSync(dbDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Execute in alphabetical order

    for (const file of files) {
      try {
        const existing = await this.dbUpdateRepo.findOne({ where: { filename: file } });
        if (existing && existing.status === 'SUCCESS') {
          continue;
        }

        this.logger.log(`Executing new SQL file: ${file}`);
        const filePath = path.join(dbDir, file);

        const sql = fs.readFileSync(filePath, 'utf8');
        if (sql && sql.trim()) {
          await this.dbUpdateRepo.manager.query(sql);
        }
        
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
