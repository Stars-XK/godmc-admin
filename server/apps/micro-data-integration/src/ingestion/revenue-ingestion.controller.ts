import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RevenueIngestionService } from './revenue-ingestion.service';
import { ResultData, NotRequireAuth } from '@app/common';

@ApiTags('营收数据跑批接入引擎')
@Controller('ingestion')
export class RevenueIngestionController {
  private readonly logger = new Logger(RevenueIngestionController.name);

  constructor(private readonly revenueIngestionService: RevenueIngestionService) {}

  @ApiOperation({ summary: '触发历史营收数据跑批任务' })
  @Post('revenue/historical')
  @NotRequireAuth()
  async triggerHistoricalBatch(
    @Body() body: { zoneCode: string; startDate: string; endDate: string }
  ) {
    const { zoneCode, startDate, endDate } = body;
    if (!startDate || !endDate) {
      return ResultData.fail(500, '必须提供 startDate 和 endDate');
    }
    
    try {
      const result = await this.revenueIngestionService.triggerHistoricalBatch(zoneCode, startDate, endDate);
      return ResultData.ok(result);
    } catch (e) {
      this.logger.error('触发历史跑批失败', e);
      return ResultData.fail(500, e.message);
    }
  }

  @ApiOperation({ summary: '手动或被定时任务触发断点缺失回溯补全' })
  @Post('revenue/backtrack')
  @NotRequireAuth()
  async triggerBacktrack() {
    try {
      await this.revenueIngestionService.detectAndFillMissingData();
      return ResultData.ok('已将最近7天的缺失扫描与回溯补全推入后台执行引擎。');
    } catch (e) {
      this.logger.error('触发回溯扫描失败', e);
      return ResultData.fail(500, e.message);
    }
  }
}
