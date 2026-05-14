import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysDictDataEntity, WaterStationEntity, WaterDeviceEntity, WaterPointEntity, WaterPipeEntity } from '@app/common';
import { StationController } from './station.controller';
import { StationService } from './station.service';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { PipeController } from './pipe.controller';
import { PipeService } from './pipe.service';
import { PipeAnalysisController } from './pipe-analysis.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SysDictDataEntity, WaterStationEntity, WaterDeviceEntity, WaterPointEntity, WaterPipeEntity])],
  controllers: [StationController, DeviceController, PointController, PipeController, PipeAnalysisController],
  providers: [StationService, DeviceService, PointService, PipeService],
})
export class EquipmentModule {}
