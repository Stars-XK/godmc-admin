import { Module } from '@nestjs/common';
import { TmqService } from './tmq.service';
import { EngineModule } from '../engine/engine.module';
import { TdengineModule } from '../tdengine/tdengine.module';

@Module({
  imports: [EngineModule, TdengineModule],
  providers: [TmqService],
  exports: [TmqService],
})
export class TmqModule {}
