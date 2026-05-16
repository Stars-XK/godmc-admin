import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QueryService } from './query.service';
import { ResultData } from '@app/common/utils/result';
import { NotRequireAuth } from '@app/common/decorators/user.decorator';

@ApiTags('时序数据查询')
@Controller('data-integration/query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @ApiOperation({ summary: '获取设备测点聚合数据(如五分钟量/小时量/日用量)' })
  @ApiQuery({ name: 'deviceCode', required: true, description: '设备编码' })
  @ApiQuery({ name: 'pointCode', required: true, description: '测点编码' })
  @ApiQuery({ name: 'startTime', required: true, description: '开始时间 (e.g. 2024-01-01 00:00:00)' })
  @ApiQuery({ name: 'endTime', required: true, description: '结束时间 (e.g. 2024-01-02 00:00:00)' })
  @ApiQuery({ name: 'interval', required: true, enum: ['5m', '1h', '1d'], description: '时间窗口(5m, 1h, 1d)' })
  @ApiQuery({ name: 'pointType', required: true, enum: ['instantaneous', 'cumulative', 'incremental'], description: '瞬时数据、累计数据或增长量数据' })
  @Get('aggregated')
  @NotRequireAuth()
  async getAggregatedData(
    @Query('deviceCode') deviceCode: string,
    @Query('pointCode') pointCode: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('interval') interval: '5m' | '1h' | '1d',
    @Query('pointType') pointType: 'instantaneous' | 'cumulative' | 'incremental',
  ) {
    if (!deviceCode || !pointCode || !startTime || !endTime || !interval || !pointType) {
      return ResultData.fail(500, '缺少必要参数');
    }
    const result = await this.queryService.getAggregatedData(deviceCode, pointCode, startTime, endTime, interval, pointType);
    return ResultData.ok(result);
  }

  @ApiOperation({ summary: '获取设备测点最新实时数据' })
  @ApiQuery({ name: 'deviceCode', required: true, description: '设备编码' })
  @ApiQuery({ name: 'pointCode', required: true, description: '测点编码' })
  @Get('latest')
  @NotRequireAuth()
  async getLatestData(
    @Query('deviceCode') deviceCode: string,
    @Query('pointCode') pointCode: string,
  ) {
    if (!deviceCode || !pointCode) {
      return ResultData.fail(500, '缺少必要参数');
    }
    const result = await this.queryService.getLatestData(deviceCode, pointCode);
    return ResultData.ok(result);
  }

  @ApiOperation({ summary: '批量获取设备测点最新实时数据' })
  @Get('latest-batch')
  @NotRequireAuth()
  async getLatestDataBatch(
    @Query('deviceCode') deviceCode?: string,
    @Query('pointCodes') pointCodes?: string,
  ) {
    const result = await this.queryService.getLatestDataBatch(deviceCode, pointCodes);
    return ResultData.ok(result);
  }

  @ApiOperation({ summary: '获取多粒度历史曲线数据' })
  @Get('history')
  @NotRequireAuth()
  async getHistoryData(
    @Query('deviceCode') deviceCode: string, 
    @Query('pointCode') pointCode: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('interval') interval: string
  ) {
    if (!deviceCode || !pointCode || !startTime || !endTime) {
      return ResultData.fail(500, '缺少必要参数');
    }
    const data = await this.queryService.getHistoryData(deviceCode, pointCode, startTime, endTime, interval);
    return ResultData.ok(data);
  }

  @ApiOperation({ summary: '批量获取分区夜间最小流量 (今日/昨日/插值/比率)' })
  @ApiQuery({ name: 'zoneCodes', required: true, description: '分区编码列表，逗号分隔' })
  @Get('zone-night-flow/batch')
  @NotRequireAuth()
  async getZoneNightFlowBatch(
    @Query('zoneCodes') zoneCodes: string,
  ) {
    if (!zoneCodes) {
      return ResultData.fail(500, '缺少必要参数 zoneCodes');
    }
    const result = await this.queryService.getZoneNightFlowBatch(zoneCodes.split(','));
    return ResultData.ok(result);
  }

  @ApiOperation({ summary: '获取分区30天夜间最小流量趋势' })
  @ApiQuery({ name: 'zoneCode', required: true, description: '分区编码' })
  @Get('zone-night-flow/trend')
  @NotRequireAuth()
  async getZoneNightFlowTrend(
    @Query('zoneCode') zoneCode: string,
  ) {
    if (!zoneCode) {
      return ResultData.fail(500, '缺少必要参数 zoneCode');
    }
    const result = await this.queryService.getZoneNightFlowTrend(zoneCode);
    return ResultData.ok(result);
  }

  @ApiOperation({ summary: '获取分区10天小时表数据' })
  @ApiQuery({ name: 'zoneCode', required: true, description: '分区编码' })
  @Get('zone-hourly/trend')
  @NotRequireAuth()
  async getZoneHourlyTrend(
    @Query('zoneCode') zoneCode: string,
  ) {
    if (!zoneCode) {
      return ResultData.fail(500, '缺少必要参数 zoneCode');
    }
    const result = await this.queryService.getZoneHourlyTrend(zoneCode);
    return ResultData.ok(result);
  }

  @ApiOperation({ summary: '获取分区下测点最新实时数据' })
  @ApiQuery({ name: 'zoneCode', required: true, description: '分区编码' })
  @Get('zone-points/latest')
  @NotRequireAuth()
  async getZonePointsLatestData(
    @Query('zoneCode') zoneCode: string,
  ) {
    if (!zoneCode) {
      return ResultData.fail(500, '缺少必要参数 zoneCode');
    }
    const result = await this.queryService.getZonePointsLatestData(zoneCode);
    return ResultData.ok(result);
  }

  @ApiOperation({ summary: '获取分区产销差数据（进水/出水对比）' })
  @ApiQuery({ name: 'zoneCode', required: true, description: '分区编码' })
  @ApiQuery({ name: 'hours', required: false, description: '查询最近N小时，默认24' })
  @Get('zone-supply-diff')
  @NotRequireAuth()
  async getZoneSupplyDiff(
    @Query('zoneCode') zoneCode: string,
    @Query('hours') hours?: string,
  ) {
    if (!zoneCode) {
      return ResultData.fail(500, '缺少必要参数 zoneCode');
    }
    const result = await this.queryService.getZoneSupplyDiff(zoneCode, hours ? Number(hours) : 24);
    return ResultData.ok(result);
  }

  @ApiOperation({ summary: '获取分区实时报警数据' })
  @ApiQuery({ name: 'zoneCode', required: true, description: '分区编码' })
  @Get('zone-alarms')
  @NotRequireAuth()
  async getZoneAlarms(
    @Query('zoneCode') zoneCode: string,
  ) {
    if (!zoneCode) {
      return ResultData.fail(500, '缺少必要参数 zoneCode');
    }
    const result = await this.queryService.getZoneAlarms(zoneCode);
    return ResultData.ok(result);
  }
}
