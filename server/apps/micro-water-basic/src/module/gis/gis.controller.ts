import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData, NotRequireAuth } from '@app/common';
import {
  WaterZoneEntity,
  WaterStationEntity,
  WaterDeviceEntity,
  SysAlarmHistoryEntity,
} from '@app/common';

@ApiTags('GIS地图图层聚合')
@Controller('gis')
export class GisController {
  constructor(
    @InjectRepository(WaterZoneEntity)
    private readonly zoneRep: Repository<WaterZoneEntity>,
    @InjectRepository(WaterStationEntity)
    private readonly stationRep: Repository<WaterStationEntity>,
    @InjectRepository(WaterDeviceEntity)
    private readonly deviceRep: Repository<WaterDeviceEntity>,
    @InjectRepository(SysAlarmHistoryEntity)
    private readonly alarmHistoryRep: Repository<SysAlarmHistoryEntity>,
  ) {}

  @ApiOperation({ summary: '获取GIS地图所有图层数据（一次返回，替代前端4次请求）' })
  @Get('layers')
  @NotRequireAuth()
  async getLayers() {
    const [zones, stations, devices, alarms] = await Promise.all([
      this.zoneRep.find({ where: { delFlag: '0' as any }, take: 500 }),
      this.stationRep.find({ where: { delFlag: '0' as any }, take: 500 }),
      this.deviceRep.find({ where: { delFlag: '0' as any }, take: 1000 }),
      this.alarmHistoryRep.find({
        where: { status: '0' as any },
        take: 50,
        order: { alarmTime: 'DESC' as any },
      }),
    ]);

    return ResultData.ok({
      zones: { rows: zones, total: zones.length },
      stations: { rows: stations, total: stations.length },
      devices: { rows: devices, total: devices.length },
      alarms: { rows: alarms, total: alarms.length },
    });
  }
}
