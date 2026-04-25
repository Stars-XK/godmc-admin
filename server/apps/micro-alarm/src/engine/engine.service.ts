import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Engine } from 'json-rules-engine';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysAlarmRuleEntity, SysAlarmHistoryEntity } from '@app/common';

@Injectable()
export class EngineService implements OnModuleInit {
  private engine: Engine;
  private readonly logger = new Logger(EngineService.name);

  constructor(
    @InjectRepository(SysAlarmRuleEntity)
    private readonly ruleRep: Repository<SysAlarmRuleEntity>,
    @InjectRepository(SysAlarmHistoryEntity)
    private readonly historyRep: Repository<SysAlarmHistoryEntity>,
  ) {}

  async onModuleInit() {
    await this.reloadEngine();
  }

  async reloadEngine() {
    this.engine = new Engine();
    const rules = await this.ruleRep.find({ where: { status: '0' } });
    
    for (const r of rules) {
      try {
        const conditions = typeof r.ruleConditions === 'string' ? JSON.parse(r.ruleConditions) : r.ruleConditions;
        this.engine.addRule({
          conditions: conditions,
          event: {
            type: 'alarm_triggered',
            params: { ruleId: r.ruleId, ruleName: r.ruleName, ruleActions: r.ruleActions }
          }
        });
      } catch (e) {
        this.logger.error(`Failed to load rule ${r.ruleId}`, e);
      }
    }

    this.engine.on('success', async (event, almanac, ruleResult) => {
      this.logger.warn(`Alarm Triggered: ${event?.params?.ruleName}`);
      // In production, evaluate facts to generate alarmContent dynamically
      let factValue = 'unknown';
      try {
        factValue = await almanac.factValue('value');
      } catch (e) {
        this.logger.debug('Fact "value" not found in almanac');
      }
      
      const history = this.historyRep.create({
        ruleId: event?.params?.ruleId,
        ruleName: event?.params?.ruleName,
        alarmLevel: '2', // Default to important for now
        alarmContent: `触发报警规则: ${event?.params?.ruleName}, 当前检测值: ${factValue}`,
        alarmTime: new Date(),
        status: '0',
      });
      await this.historyRep.save(history);
      // TODO: Push to Frontend via WebSocket
    });
  }

  async evaluate(facts: Record<string, any>) {
    if (!this.engine) {
      this.logger.warn('Engine not initialized yet');
      return null;
    }
    return this.engine.run(facts);
  }
}
