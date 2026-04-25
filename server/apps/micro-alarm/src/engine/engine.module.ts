import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EngineService } from './engine.service';
import { SysAlarmRuleEntity, SysAlarmHistoryEntity } from '@app/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysAlarmRuleEntity, SysAlarmHistoryEntity]),
  ],
  providers: [EngineService],
  exports: [EngineService],
})
export class EngineModule {}
