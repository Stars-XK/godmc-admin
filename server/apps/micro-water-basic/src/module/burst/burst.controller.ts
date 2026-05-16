import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BurstService } from './burst.service';
import { BurstAreaService } from './burst-area.service';
import { BurstAlertService } from './burst-alert.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { NotRequireAuth } from '@app/common';

@ApiTags('水务基础-爆管分析')
@ApiBearerAuth()
@Controller('water-basic/burst')
export class BurstController {
  constructor(
    private readonly burstService: BurstService,
    private readonly burstAreaService: BurstAreaService,
    private readonly burstAlertService: BurstAlertService,
  ) {}

  @ApiOperation({ summary: '对指定分区执行爆管分析' })
  @Post('analyze/:zoneCode')
  async analyzeZone(@Param('zoneCode') zoneCode: string) {
    return this.burstService.analyzeZone(zoneCode);
  }

  @ApiOperation({ summary: '对所有分区执行爆管分析' })
  @Post('analyze-all')
  async analyzeAllZones() {
    return this.burstService.analyzeAllZones();
  }

  @ApiOperation({ summary: '分页查询爆管事件列表' })
  @Get('events')
  async getEvents(@Query() query: any) {
    return this.burstService.getEvents(query);
  }

  @ApiOperation({ summary: '获取爆管事件详情' })
  @Get('events/:id')
  async getEventDetail(@Param('id') id: string) {
    return this.burstService.getEventDetail(+id);
  }

  @ApiOperation({ summary: '更新事件状态(确认/误报/修复)' })
  @Put('events/:id')
  async updateEventStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.burstService.updateEventStatus(+id, status);
  }

  @ApiOperation({ summary: '获取爆管影响面GeoJSON' })
  @Get('area/:eventId')
  @NotRequireAuth()
  async getAffectedArea(@Param('eventId') eventId: string) {
    const area = await this.burstAreaService.getAffectedArea(+eventId);
    if (!area) return { code: 500, msg: '影响面不存在' };
    return {
      code: 200,
      data: {
        geojson: area.areaGeojson ? JSON.parse(area.areaGeojson) : null,
        areaSize: area.areaSize,
        affectedPipeCount: area.affectedPipeCount,
        affectedDeviceCount: area.affectedDeviceCount,
        estimatedWaterLoss: area.estimatedWaterLoss,
      },
    };
  }

  @ApiOperation({ summary: '获取所有分区爆管风险等级' })
  @Get('risk-zones')
  async getRiskZones() {
    return this.burstService.getRiskZones();
  }

  @ApiOperation({ summary: '获取指定分区历史爆管记录' })
  @Get('history/:zoneCode')
  async getHistoryByZone(@Param('zoneCode') zoneCode: string) {
    return this.burstService.getHistoryByZone(zoneCode);
  }
}
