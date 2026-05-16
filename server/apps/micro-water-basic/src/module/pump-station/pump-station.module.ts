import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WaterStationEntity, WaterPointEntity } from '@app/common';
import { PumpStationController } from './pump-station.controller';
import { PumpStationService } from './pump-station.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WaterStationEntity, WaterPointEntity]),
    HttpModule,
  ],
  controllers: [PumpStationController],
  providers: [PumpStationService],
  exports: [PumpStationService],
})
export class PumpStationModule {}
