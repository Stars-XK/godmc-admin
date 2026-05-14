import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterEnergyEntity, WaterStationEntity } from '@app/common';
import { EnergyController } from './energy.controller';
import { EnergyService } from './energy.service';

@Module({
  imports: [TypeOrmModule.forFeature([WaterEnergyEntity, WaterStationEntity])],
  controllers: [EnergyController],
  providers: [EnergyService],
  exports: [EnergyService],
})
export class EnergyModule {}
