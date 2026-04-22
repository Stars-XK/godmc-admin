import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WaterPointEntity, WaterDeviceEntity, WaterStationEntity } from '@app/common';
import { StatusEngineService } from './status-engine.service';
import { MicroservicesModule } from '../../../microservices.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([WaterPointEntity, WaterDeviceEntity, WaterStationEntity]),
    MicroservicesModule,
  ],
  providers: [StatusEngineService],
})
export class StatusEngineModule {}