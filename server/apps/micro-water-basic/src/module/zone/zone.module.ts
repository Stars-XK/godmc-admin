import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterZoneEntity, WaterDeviceEntity, WaterPointEntity, WaterZoneMetricCalcEntity, WaterStationEntity } from '@app/common';
import { WaterRevenueUserEntity } from '@app/common/entities/water-basic/water-revenue-user.entity';
import { ZoneController } from './zone.controller';
import { ZoneService } from './zone.service';

@Module({
  imports: [TypeOrmModule.forFeature([WaterZoneEntity, WaterDeviceEntity, WaterStationEntity, WaterRevenueUserEntity, WaterPointEntity, WaterZoneMetricCalcEntity])],
  controllers: [ZoneController],
  providers: [ZoneService],
})
export class ZoneModule {}
