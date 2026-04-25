import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngineService } from './engine.service';
import { SysAlarmRuleEntity, SysAlarmHistoryEntity } from '@app/common';
import { RedisModule } from '@app/shared';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysAlarmRuleEntity, SysAlarmHistoryEntity]),
    RedisModule
  ],
  providers: [EngineService],
  exports: [EngineService],
})
export class EngineModule {}
