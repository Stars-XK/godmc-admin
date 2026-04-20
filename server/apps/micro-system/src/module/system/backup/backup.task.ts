import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { ConfigService as SysConfigService } from '../config/config.service';
import { CronJob } from 'cron';

@Injectable()
export class BackupTask {
  private readonly logger = new Logger(BackupTask.name);

  constructor(
    private readonly backupService: BackupService,
    private readonly sysConfig: SysConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    // delay initialization to allow database connection to establish
    setTimeout(() => {
      this.initCron().catch(e => this.logger.error('Failed to init cron', e));
    }, 5000);
  }

  async initCron() {
    const cronExp = await this.sysConfig.getConfigValue('sys.backup.cron') || '0 0 2 * * *';
    const job = new CronJob(cronExp, async () => {
      this.logger.log('Starting automated database backup...');
      try {
        await this.backupService.createBackup();
      } catch (e) {
        this.logger.error('Automated backup failed', e);
      }
    }) as any;

    this.schedulerRegistry.addCronJob('database_backup', job);
    job.start();
    this.logger.log(`Automated backup job scheduled with cron: ${cronExp}`);
  }
}
