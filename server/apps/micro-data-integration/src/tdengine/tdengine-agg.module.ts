import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterPointEntity } from '@app/common';
import { TdengineModule } from './tdengine.module';
import { TdengineAggService } from './tdengine-agg.service';
import { TdengineAggScheduler } from './tdengine-agg.scheduler';

@Module({
  imports: [TdengineModule, TypeOrmModule.forFeature([WaterPointEntity])],
  providers: [TdengineAggService, TdengineAggScheduler],
  exports: [TdengineAggService],
})
export class TdengineAggModule {}

