import { Module } from '@nestjs/common';
import { TmqService } from './tmq.service';
import { EngineModule } from '../engine/engine.module';

@Module({
  imports: [EngineModule],
  providers: [TmqService],
  exports: [TmqService],
})
export class TmqModule {}
