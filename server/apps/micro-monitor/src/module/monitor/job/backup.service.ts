import { Injectable } from '@nestjs/common';
import { Task } from '@app/common/decorators/task.decorator';

@Injectable()
export class BackupService {
  @Task({
    name: 'dailyBackup',
    description: '每日备份任务（通过 micro-system 的 system/backup 模块实现）',
  })
  async performBackup(params: string) {
    // 备份功能已由 micro-system 的 BackupModule 完整实现。
    // 可通过 HTTP 调用 POST /system/backup/create 触发备份。
    console.log('performBackup (delegated to micro-system)', params);
  }
}
