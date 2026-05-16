import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common';
import {
  WaterZoneEntity,
  WaterStationEntity,
  WaterDeviceEntity,
  SysAlarmHistoryEntity,
} from '@app/common';

@Injectable()
export class GisService {
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
