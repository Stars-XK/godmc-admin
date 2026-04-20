import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { BackupTask } from './backup.task';
import { SysConfigModule } from '../config/config.module';

@Module({
  imports: [SysConfigModule],
  controllers: [BackupController],
  providers: [BackupService, BackupTask],
  exports: [BackupService]
})
export class BackupModule {}
