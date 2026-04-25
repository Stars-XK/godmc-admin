import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RuleService } from './rule.service';
import { RuleController } from './rule.controller';
import { SysAlarmRuleEntity, SysAlarmHistoryEntity } from '@app/common';

@Module({
  imports: [TypeOrmModule.forFeature([SysAlarmRuleEntity, SysAlarmHistoryEntity])],
  controllers: [RuleController],
  providers: [RuleService],
  exports: [RuleService],
})
export class RuleModule {}
