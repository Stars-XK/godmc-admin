import { Controller, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EngineService } from './engine.service';
import { ResultData } from '@app/common/utils/result';

@ApiTags('任务调度控制')
@Controller('data-integration/engine')
export class EngineController {
  constructor(private readonly engineService: EngineService) {}

  @ApiOperation({ summary: '重新加载所有启用的接入任务' })
  @Post('reload')
  async reloadTasks() {
    await this.engineService.reloadTasks();
    return ResultData.ok();
  }

  @ApiOperation({ summary: '手动立即执行一次接入任务' })
  @Post('task/run/:id')
  async runTask(@Param('id') id: string) {
    // 异步执行，不阻塞接口返回，避免大数据量同步导致网关超时报错
    this.engineService.runTaskManually(Number(id)).catch(err => {
      console.error(`手动执行任务 ${id} 失败`, err);
    });
    return ResultData.ok(null, '任务已在后台触发执行，请稍后刷新列表查看执行状态');
  }
}