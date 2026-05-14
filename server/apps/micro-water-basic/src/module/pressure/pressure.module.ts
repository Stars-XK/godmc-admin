import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterPointEntity, WaterDeviceEntity } from '@app/common';
import { PressureController } from './pressure.controller';
import { PressureService } from './pressure.service';

@Module({
  imports: [TypeOrmModule.forFeature([WaterPointEntity, WaterDeviceEntity])],
  controllers: [PressureController],
  providers: [PressureService],
  exports: [PressureService],
})
export class PressureModule {}
