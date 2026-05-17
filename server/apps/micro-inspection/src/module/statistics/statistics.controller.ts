import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';

@ApiTags('巡检管理 - 统计分析')
@ApiBearerAuth()
@Controller('inspection/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @ApiOperation({ summary: '获取仪表盘数据（KPI+趋势+排行榜）' })
  @RequirePermission('inspection:statistics:query')
  @Get('dashboard')
  getDashboard(@Query() query: any) {
    return this.statisticsService.getDashboard(query);
  }

  @ApiOperation({ summary: '获取日趋势' })
  @RequirePermission('inspection:statistics:query')
  @Get('trend')
  getDailyTrend(@Query('days') days?: string) {
    return this.statisticsService.getDailyTrend(Number(days) || 30);
  }

  @ApiOperation({ summary: '获取检查员排行榜' })
  @RequirePermission('inspection:statistics:query')
  @Get('ranking')
  getInspectorRanking(@Query('limit') limit?: string) {
    return this.statisticsService.getInspectorRanking(Number(limit) || 10);
  }

  @ApiOperation({ summary: '获取合规率详情' })
  @RequirePermission('inspection:statistics:query')
  @Get('compliance')
  getCompliance(@Query() query: any) {
    return this.statisticsService.getCompliance(query);
  }

  @ApiOperation({ summary: '获取问题趋势' })
  @RequirePermission('inspection:statistics:query')
  @Get('issue-trend')
  getIssueTrend(@Query() query: any) {
    return this.statisticsService.getIssueTrend(query);
  }
}
