import { Injectable } from '@nestjs/common';
import { Task } from '@app/common/decorators/task.decorator';

@Injectable()
export class BackupService {
  @Task({
    name: 'dailyBackup',
    description: '每日备份任务',
  })
  async performBackup(params: string) {
    console.log('performBackup', params);
    // 实现备份逻辑
  }
}
