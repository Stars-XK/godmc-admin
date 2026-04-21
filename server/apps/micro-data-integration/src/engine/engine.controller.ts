import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TaskSchedulerService } from './task-scheduler.service';
import { ResultData } from '@app/common/utils/result';

@ApiTags('任务调度控制')
@Controller('engine')
export class EngineController {
  constructor(private readonly taskSchedulerService: TaskSchedulerService) {}

  @ApiOperation({ summary: '重新加载所有启用的接入任务' })
  @Post('reload')
  async reloadTasks() {
    await this.taskSchedulerService.reloadAllTasks();
    return ResultData.ok();
  }
}