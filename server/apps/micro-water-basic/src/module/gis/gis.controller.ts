import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NotRequireAuth } from '@app/common';
import { GisService } from './gis.service';

@ApiTags('GIS地图图层聚合')
@Controller('gis')
export class GisController {
  constructor(private readonly gisService: GisService) {}

  @ApiOperation({ summary: '获取GIS地图所有图层数据（支持视口裁剪）' })
  @ApiQuery({ name: 'swLng', required: false, description: '西南角经度' })
  @ApiQuery({ name: 'swLat', required: false, description: '西南角纬度' })
  @ApiQuery({ name: 'neLng', required: false, description: '东北角经度' })
  @ApiQuery({ name: 'neLat', required: false, description: '东北角纬度' })
  @Get('layers')
  @NotRequireAuth()
  async getLayers(
    @Query('swLng') swLng?: string,
    @Query('swLat') swLat?: string,
    @Query('neLng') neLng?: string,
    @Query('neLat') neLat?: string,
  ) {
    const bbox = swLng && swLat && neLng && neLat
      ? { swLng: +swLng, swLat: +swLat, neLng: +neLng, neLat: +neLat }
      : undefined;
    return this.gisService.getLayers(bbox);
  }

  @ApiOperation({ summary: '获取管线图层数据（按缩放级别简化）' })
  @ApiQuery({ name: 'swLng', required: true, description: '西南角经度' })
  @ApiQuery({ name: 'swLat', required: true, description: '西南角纬度' })
  @ApiQuery({ name: 'neLng', required: true, description: '东北角经度' })
  @ApiQuery({ name: 'neLat', required: true, description: '东北角纬度' })
  @ApiQuery({ name: 'zoom', required: false, description: '当前地图缩放级别' })
  @Get('pipes')
  @NotRequireAuth()
  async getPipes(
    @Query('swLng') swLng: string,
    @Query('swLat') swLat: string,
    @Query('neLng') neLng: string,
    @Query('neLat') neLat: string,
    @Query('zoom') zoom?: string,
  ) {
    const bbox = { swLng: +swLng, swLat: +swLat, neLng: +neLng, neLat: +neLat };
    return this.gisService.getPipes(bbox, zoom ? +zoom : undefined);
  }
}
