import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GisController } from './gis.controller';
import {
  WaterZoneEntity,
  WaterStationEntity,
  WaterDeviceEntity,
  SysAlarmHistoryEntity,
} from '@app/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WaterZoneEntity,
      WaterStationEntity,
      WaterDeviceEntity,
      SysAlarmHistoryEntity,
    ]),
  ],
  controllers: [GisController],
})
export class GisModule {}
