import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WaterQualityService } from './water-quality.service';
import { ResultData } from '@app/common/utils/result';

@ApiTags('水质监测')
@Controller('water-basic/water-quality')
export class WaterQualityController {
  constructor(private readonly service: WaterQualityService) {}

  @ApiOperation({ summary: '获取水质监测点列表（含最新数据）' })
  @Get('points')
  async getPoints() {
    return this.service.getQualityPoints();
  }

  @ApiOperation({ summary: '获取水质监测点趋势数据' })
  @ApiQuery({ name: 'pointCode', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'interval', required: false, description: '聚合间隔(5m/1h/1d), 默认1h' })
  @Get('trend')
  async getTrend(
    @Query('pointCode') pointCode: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval?: string,
  ) {
    if (!pointCode || !startDate || !endDate) {
      return ResultData.fail(500, '缺少必要参数');
    }
    return this.service.getTrend(pointCode, startDate, endDate, interval || '1h');
  }
}
