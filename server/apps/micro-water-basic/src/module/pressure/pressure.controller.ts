import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PressureService } from './pressure.service';
import { ResultData } from '@app/common/utils/result';

@ApiTags('压力监测')
@Controller('water-basic/pressure')
export class PressureController {
  constructor(private readonly service: PressureService) {}

  @ApiOperation({ summary: '获取压力监测点列表（按分区/站点分组）' })
  @Get('points')
  async getPoints() {
    return this.service.getPressurePoints();
  }
}
