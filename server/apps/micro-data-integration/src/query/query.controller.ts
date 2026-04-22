import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { QueryService } from './query.service';
import { ResultData } from '@app/common/utils/result';
import { NotRequireAuth } from '@app/common/decorators/not-require-auth.decorator';

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
  @ApiQuery({ name: 'pointType', required: true, enum: ['instantaneous', 'cumulative'], description: '瞬时数据或累计数据' })
  @Get('aggregated')
  @NotRequireAuth()
  async getAggregatedData(
    @Query('deviceCode') deviceCode: string,
    @Query('pointCode') pointCode: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('interval') interval: '5m' | '1h' | '1d',
    @Query('pointType') pointType: 'instantaneous' | 'cumulative',
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
}
