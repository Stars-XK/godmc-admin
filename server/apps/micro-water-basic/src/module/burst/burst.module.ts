import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import {
  WaterZoneEntity,
  WaterPipeEntity,
  WaterDeviceEntity,
  WaterPointEntity,
  WaterStationEntity,
  WaterBurstEventEntity,
  WaterBurstAreaEntity,
  SysAlarmRuleEntity,
  SysAlarmHistoryEntity,
} from '@app/common';
import { BurstController } from './burst.controller';
import { BurstService } from './burst.service';
import { BurstAreaService } from './burst-area.service';
import { BurstAlertService } from './burst-alert.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      WaterZoneEntity,
      WaterPipeEntity,
      WaterDeviceEntity,
      WaterPointEntity,
      WaterStationEntity,
      WaterBurstEventEntity,
      WaterBurstAreaEntity,
      SysAlarmRuleEntity,
      SysAlarmHistoryEntity,
    ]),
  ],
  controllers: [BurstController],
  providers: [BurstService, BurstAreaService, BurstAlertService],
  exports: [BurstService],
})
export class BurstModule {}
