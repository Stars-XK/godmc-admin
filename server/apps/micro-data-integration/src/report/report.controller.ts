import { Controller, Get, Query, Logger, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { TdengineService } from '../tdengine/tdengine.service';
import { ResultData, NotRequireAuth } from '@app/common';
import dayjs from 'dayjs';

@ApiTags('产销差报表聚合查询')
@Controller('report')
export class ReportController {
  private readonly logger = new Logger(ReportController.name);

  constructor(
    private readonly reportService: ReportService,
    private readonly tdengineService: TdengineService,
  ) {}

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

    const supplySql = `
      SELECT ts, total_val 
      FROM water_iot.zone_meters_${type} 
      WHERE metric_type = 'water_supply' 
        AND ts >= '${startDate} 00:00:00' 
        AND ts <= '${endDate} 23:59:59' 
        AND zone_code = '${zoneCode}' 
      ORDER BY ts ASC
    `;

    const salesSql = `
      SELECT ts, total_val 
      FROM water_iot.zone_revenue_${type} 
      WHERE metric_type = 'water_sales' 
        AND ts >= '${startDate} 00:00:00' 
        AND ts <= '${endDate} 23:59:59' 
        AND zone_code = '${zoneCode}' 
      ORDER BY ts ASC
    `;

    try {
      const [supplyRes, salesRes] = await Promise.all([
        this.tdengineService.querySql(supplySql),
        this.tdengineService.querySql(salesSql)
      ]);

      const supplyMap = new Map<string, number>();
      if (supplyRes && supplyRes.data) {
        supplyRes.data.forEach(row => {
          const tsStr = dayjs(row[0]).format(type === '1d' ? 'YYYY-MM-DD' : 'YYYY-MM');
          supplyMap.set(tsStr, row[1]);
        });
      }

      const salesMap = new Map<string, number>();
      if (salesRes && salesRes.data) {
        salesRes.data.forEach(row => {
          const tsStr = dayjs(row[0]).format(type === '1d' ? 'YYYY-MM-DD' : 'YYYY-MM');
          salesMap.set(tsStr, row[1]);
        });
      }

      const result = [];
      const days = dayjs(endDate).diff(dayjs(startDate), type === '1d' ? 'day' : 'month') + 1;
      
      for (let i = 0; i < days; i++) {
        const d = dayjs(startDate).add(i, type === '1d' ? 'day' : 'month');
        const tsStr = d.format(type === '1d' ? 'YYYY-MM-DD' : 'YYYY-MM');
        
        const supply = supplyMap.get(tsStr) || 0;
        const sales = salesMap.get(tsStr) || 0;
        const diff = Number((supply - sales).toFixed(3));
        const ratio = supply > 0 ? Number(((diff / supply) * 100).toFixed(2)) : 0; 

        result.push({
          date: tsStr,
          supply: supply,
          sales: sales,
          nrw_diff: diff,   
          nrw_ratio: ratio  
        });
      }

      return ResultData.ok(result);
    } catch (e) {
      this.logger.error('查询产销差报表失败', e);
      return ResultData.fail(500, e.message);
    }
  }
}
