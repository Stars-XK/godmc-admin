import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterPointEntity, WaterZoneMetricCalcEntity } from '@app/common';
import { TdengineModule } from './tdengine.module';
import { TdengineAggService } from './tdengine-agg.service';
import { TdengineAggScheduler } from './tdengine-agg.scheduler';
import { TdengineRetryScheduler } from './tdengine-retry.scheduler';
import { TdengineZoneAggService } from './tdengine-zone-agg.service';
import { TdengineZoneAggScheduler } from './tdengine-zone-agg.scheduler';

@Module({
  imports: [
    TdengineModule, 
    TypeOrmModule.forFeature([WaterPointEntity, WaterZoneMetricCalcEntity])
  ],
  providers: [
    TdengineAggService, 
    TdengineAggScheduler, 
    TdengineRetryScheduler,
    TdengineZoneAggService,
    TdengineZoneAggScheduler
  ],
  exports: [TdengineAggService],
})
export class TdengineAggModule {}
