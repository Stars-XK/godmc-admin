import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterPointEntity, WaterDeviceEntity, WaterStationEntity } from '@app/common';
import { StatusEngineService } from './status-engine.service';
import { MicroservicesModule } from '../../../microservices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WaterPointEntity, WaterDeviceEntity, WaterStationEntity]),
    MicroservicesModule,
  ],
  providers: [StatusEngineService],
})
export class StatusEngineModule {}