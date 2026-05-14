import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FlowMonitorService } from './flow-monitor.service';

@ApiTags('流量监控')
@Controller('water-basic/flow-monitor')
export class FlowMonitorController {
  constructor(private readonly service: FlowMonitorService) {}

  @ApiOperation({ summary: '获取流量监测点列表（按设备分组）' })
  @Get('points')
  async getPoints() {
    return this.service.getFlowPoints();
  }
}
