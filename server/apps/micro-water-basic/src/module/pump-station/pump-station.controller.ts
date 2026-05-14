import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PumpStationService } from './pump-station.service';
import { ResultData } from '@app/common/utils/result';

@ApiTags('泵站监控')
@Controller('water-basic/pump-station')
export class PumpStationController {
  constructor(private readonly service: PumpStationService) {}

  @ApiOperation({ summary: '获取泵站列表（含运行状态概要）' })
  @ApiQuery({ name: 'pageNum', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @Get('list')
  async list(
    @Query('pageNum') pageNum?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.service.getStationsWithStatus({
      pageNum: pageNum ? Number(pageNum) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      keyword: keyword || undefined,
    });
  }

  @ApiOperation({ summary: '获取泵站详情（含关联测点最新数据）' })
  @ApiQuery({ name: 'stationCode', required: true })
  @Get('detail')
  async detail(@Query('stationCode') stationCode: string) {
    if (!stationCode) return ResultData.fail(500, '缺少 stationCode');
    return this.service.getStationDetail(stationCode);
  }
}
