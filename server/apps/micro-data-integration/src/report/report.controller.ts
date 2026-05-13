import { Controller, Get, Query, Logger, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { ResultData, NotRequireAuth } from '@app/common';

@ApiTags('产销差报表聚合查询')
@Controller('report')
export class ReportController {
  private readonly logger = new Logger(ReportController.name);

  constructor(private readonly reportService: ReportService) {}

  @ApiOperation({ summary: '手动触发产销差日聚合任务(或由系统任务触发)' })
  @Post('trigger-daily-agg')
  @NotRequireAuth()
  async triggerDailyAgg() {
    try {
      await this.reportService.calculateDailyNRW();
      return ResultData.ok('触发分区产销差售水量日聚合任务成功');
    } catch (e) {
      return ResultData.fail(500, e.message);
    }
  }

  @ApiOperation({ summary: '手动触发产销差月聚合任务(或由系统任务触发)' })
  @Post('trigger-monthly-agg')
  @NotRequireAuth()
  async triggerMonthlyAgg() {
    try {
      await this.reportService.calculateMonthlyNRW();
      return ResultData.ok('触发分区产销差售水量月聚合任务成功');
    } catch (e) {
      return ResultData.fail(500, e.message);
    }
  }

  @ApiOperation({ summary: '手动触发产销差聚合任务(特定日期)' })
  @Get('trigger-agg')
  @NotRequireAuth()
  async triggerAgg(@Query('date') date: string, @Query('type') type: '1d' | '1mo') {
    if (!date || !type) return ResultData.fail(500, '必须提供 date(YYYY-MM-DD/YYYY-MM) 和 type(1d/1mo)');
    try {
      await this.reportService.aggregateRevenueForDate(date, type);
      return ResultData.ok(`已成功触发并完成 ${date} 的 ${type} 分区售水量向上聚合计算`);
    } catch (e) {
      return ResultData.fail(500, e.message);
    }
  }

  @ApiOperation({ summary: '查询某分区的产销差(日/月)报表数据' })
  @ApiQuery({ name: 'zoneCode', required: true, description: '分区编码' })
  @ApiQuery({ name: 'startDate', required: true, description: '开始时间(YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: '结束时间(YYYY-MM-DD)' })
  @ApiQuery({ name: 'type', required: true, description: '报表类型: 1d(日) / 1mo(月)' })
  @Get('nrw-trend')
  @NotRequireAuth()
  async getNrwTrend(
    @Query('zoneCode') zoneCode: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('type') type: '1d' | '1mo'
  ) {
    if (!zoneCode || !startDate || !endDate || !type) {
      return ResultData.fail(500, '缺少必要参数');
    }
    return this.reportService.getNrwTrend(zoneCode, startDate, endDate, type);
  }

  @ApiOperation({ summary: '获取分区产销差报表树（含所有节点数据，一次返回，替代前端N+1递归调用）' })
  @ApiQuery({ name: 'date', required: true, description: '目标日期(YYYY-MM-DD)或月份(YYYY-MM)' })
  @ApiQuery({ name: 'type', required: true, description: '报表类型: 1d(日) / 1mo(月)' })
  @Get('tree-summary')
  @NotRequireAuth()
  async getTreeSummary(
    @Query('date') date: string,
    @Query('type') type: '1d' | '1mo'
  ) {
    if (!date || !type) {
      return ResultData.fail(500, '必须提供 date 和 type');
    }
    return this.reportService.getTreeSummary(date, type);
  }
}
