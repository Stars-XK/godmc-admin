import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportCenterController } from './report-center.controller';
import { ReportCenterService } from './report-center.service';
import {
  SysReportEntity,
  WaterZoneEntity,
  WaterStationEntity,
  WaterDeviceEntity,
  WaterPointEntity,
  SysAlarmHistoryEntity,
} from '@app/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SysReportEntity,
      WaterZoneEntity,
      WaterStationEntity,
      WaterDeviceEntity,
      WaterPointEntity,
      SysAlarmHistoryEntity,
    ]),
  ],
  controllers: [ReportCenterController],
  providers: [ReportCenterService],
  exports: [ReportCenterService],
})
export class ReportCenterModule {}
