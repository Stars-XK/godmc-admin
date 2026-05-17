import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MicroInspectionService } from './micro-inspection.service';
import { NotRequireAuth } from '@app/common';

@ApiTags('巡检管理 - 服务入口')
@ApiBearerAuth()
@Controller('inspection')
export class MicroInspectionController {
  constructor(private readonly service: MicroInspectionService) {}

  @ApiOperation({ summary: '巡检服务健康检查' })
  @NotRequireAuth()
  @Get('health')
  health() {
    return this.service.health();
  }
}
