import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RuleService } from './rule.service';
import { RuleController } from './rule.controller';
import { SysAlarmRuleEntity, SysAlarmHistoryEntity } from '@app/common';
import { EngineModule } from '../engine/engine.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysAlarmRuleEntity, SysAlarmHistoryEntity]),
    forwardRef(() => EngineModule),
  ],
  controllers: [RuleController],
  providers: [RuleService],
  exports: [RuleService],
})
export class RuleModule {}
