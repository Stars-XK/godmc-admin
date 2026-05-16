import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GisController } from './gis.controller';
import { GisService } from './gis.service';
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
  providers: [GisService],
})
export class GisModule {}
