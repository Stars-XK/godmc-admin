import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WaterPointEntity, WaterDeviceEntity, WaterStationEntity } from '@app/common';
import { StatusEngineService } from './status-engine.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([WaterPointEntity, WaterDeviceEntity, WaterStationEntity]),
  ],
  providers: [StatusEngineService],
})
export class StatusEngineModule {}