import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotRequireAuth } from '@app/common';
import { GisService } from './gis.service';

@ApiTags('GIS地图图层聚合')
@Controller('gis')
export class GisController {
  constructor(private readonly gisService: GisService) {}

  @ApiOperation({ summary: '获取GIS地图所有图层数据（一次返回，替代前端4次请求）' })
  @Get('layers')
  @NotRequireAuth()
  async getLayers() {
    return this.gisService.getLayers();
  }
}
