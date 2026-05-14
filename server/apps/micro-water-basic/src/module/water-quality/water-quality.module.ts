import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterPointEntity } from '@app/common';
import { WaterQualityController } from './water-quality.controller';
import { WaterQualityService } from './water-quality.service';

@Module({
  imports: [TypeOrmModule.forFeature([WaterPointEntity])],
  controllers: [WaterQualityController],
  providers: [WaterQualityService],
  exports: [WaterQualityService],
})
export class WaterQualityModule {}
