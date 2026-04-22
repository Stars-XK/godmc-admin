import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysDictDataEntity, WaterStationEntity, WaterDeviceEntity, WaterPointEntity } from '@app/common';
import { StationController } from './station.controller';
import { StationService } from './station.service';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { PointController } from './point.controller';
import { PointService } from './point.service';

@Module({
  imports: [TypeOrmModule.forFeature([SysDictDataEntity, WaterStationEntity, WaterDeviceEntity, WaterPointEntity])],
  controllers: [StationController, DeviceController, PointController],
  providers: [StationService, DeviceService, PointService],
})
export class EquipmentModule {}
