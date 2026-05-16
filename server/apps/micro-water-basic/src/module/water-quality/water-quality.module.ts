import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WaterPointEntity, WaterDeviceEntity } from '@app/common';
import { WaterQualityController } from './water-quality.controller';
import { WaterQualityService } from './water-quality.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WaterPointEntity, WaterDeviceEntity]),
    HttpModule,
  ],
  controllers: [WaterQualityController],
  providers: [WaterQualityService],
  exports: [WaterQualityService],
})
export class WaterQualityModule {}
