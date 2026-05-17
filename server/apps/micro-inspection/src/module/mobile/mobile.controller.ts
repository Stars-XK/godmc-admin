import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MobileService } from './mobile.service';
import { NotRequireAuth } from '@app/common';

@ApiTags('巡检管理 - 移动端')
@ApiBearerAuth()
@Controller('inspection/mobile')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @ApiOperation({ summary: '移动端健康检查' })
  @NotRequireAuth()
  @Get('health')
  health() {
    return this.mobileService.health();
  }
}
