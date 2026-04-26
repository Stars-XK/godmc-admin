import { Controller, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TaskSchedulerService } from './task-scheduler.service';
import { ResultData } from '@app/common/utils/result';

@ApiTags('任务调度控制')
@Controller('data-integration/engine')
export class EngineController {
  constructor(private readonly taskSchedulerService: TaskSchedulerService) {}

  @ApiOperation({ summary: '重新加载所有启用的接入任务' })
  @Post('reload')
  async reloadTasks() {
    await this.taskSchedulerService.reloadAllTasks();
    return ResultData.ok();
  }

  @ApiOperation({ summary: '手动立即执行一次接入任务' })
  @Post('task/run/:id')
  async runTask(@Param('id') id: string) {
    await this.taskSchedulerService.runTaskManually(Number(id));
    return ResultData.ok(null, '已触发执行');
  }
}