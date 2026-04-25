import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Engine } from 'json-rules-engine';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysAlarmRuleEntity, SysAlarmHistoryEntity } from '@app/common';
import { RedisService } from '@app/shared';

@Injectable()
export class EngineService implements OnModuleInit {
  private engine: Engine;
  private readonly logger = new Logger(EngineService.name);

  constructor(
    @InjectRepository(SysAlarmRuleEntity)
    private readonly ruleRep: Repository<SysAlarmRuleEntity>,
    @InjectRepository(SysAlarmHistoryEntity)
    private readonly historyRep: Repository<SysAlarmHistoryEntity>,
    private readonly redisService: RedisService
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
        const actions = typeof r.ruleActions === 'string' ? JSON.parse(r.ruleActions) : r.ruleActions;
        this.engine.addRule({
          conditions: conditions,
          event: {
            type: 'alarm_triggered',
            params: { ruleId: r.ruleId, ruleName: r.ruleName, ruleActions: actions }
          }
        });
      } catch (e) {
        this.logger.error(`Failed to load rule ${r.ruleId}`, e);
      }
    }

    // SUCCESS HANDLER (Rule Matched)
    this.engine.on('success', async (event, almanac, ruleResult) => {
      const actions = event?.params?.ruleActions || {};
      const debounce = actions.debounce;
      
      let deviceId = 'global';
      try { deviceId = await almanac.factValue('deviceId') || await almanac.factValue('zoneCode') || 'global'; } catch(e) {}
      
      let factValue = 'unknown';
      try { factValue = await almanac.factValue('value'); } catch(e) {}

      const ruleId = event?.params?.ruleId;
      
      if (debounce && debounce.enabled) {
        const threshold = debounce.threshold || 1;
        const now = Date.now();
        
        if (debounce.strategy === 'count') {
          const key = `alarm:window:${ruleId}:${deviceId}`;
          const eventId = `${now}-${Math.random().toString(36).substring(7)}`;
          await this.redisService.getClient().zadd(key, now, eventId);
          await this.redisService.getClient().expire(key, 3600); // 1 hour TTL
          
          const count = await this.redisService.getClient().zcard(key);
          if (count >= threshold) {
            await this.redisService.getClient().del(key); // Reset after trigger
            await this.fireAlarm(ruleId, event?.params?.ruleName, factValue);
          }
        } else if (debounce.strategy === 'time') {
          const key = `alarm:state:${ruleId}:${deviceId}`;
          const existingTime = await this.redisService.getClient().get(key);
          
          if (!existingTime) {
            await this.redisService.getClient().set(key, now, 'EX', threshold * 60 * 2); // 2x TTL
          } else {
            const diffMinutes = (now - parseInt(existingTime, 10)) / (1000 * 60);
            if (diffMinutes >= threshold) {
              await this.redisService.getClient().del(key); // Reset after trigger
              await this.fireAlarm(ruleId, event?.params?.ruleName, factValue);
            }
          }
        }
      } else {
        // Immediate alarm
        await this.fireAlarm(ruleId, event?.params?.ruleName, factValue);
      }
    });

    // FAILURE HANDLER (Rule Not Matched - Reset State)
    this.engine.on('failure', async (event, almanac, ruleResult) => {
      const actions = event?.params?.ruleActions || {};
      const debounce = actions.debounce;
      
      if (debounce && debounce.enabled) {
        let deviceId = 'global';
        try { deviceId = await almanac.factValue('deviceId') || await almanac.factValue('zoneCode') || 'global'; } catch(e) {}
        const ruleId = event?.params?.ruleId;
        
        if (debounce.strategy === 'count') {
          await this.redisService.getClient().del(`alarm:window:${ruleId}:${deviceId}`);
        } else if (debounce.strategy === 'time') {
          await this.redisService.getClient().del(`alarm:state:${ruleId}:${deviceId}`);
        }
      }
    });
  }

  private async fireAlarm(ruleId: number, ruleName: string, factValue: any) {
    this.logger.warn(`Alarm Triggered: ${ruleName}`);
    const history = this.historyRep.create({
      ruleId: ruleId,
      ruleName: ruleName,
      alarmLevel: '2',
      alarmContent: `触发报警规则: ${ruleName}, 当前检测值: ${factValue}`,
      alarmTime: new Date(),
      status: '0',
    });
    await this.historyRep.save(history);
  }

  async evaluate(facts: Record<string, any>) {
    if (!this.engine) {
      this.logger.warn('Engine not initialized yet');
      return null;
    }
    return this.engine.run(facts);
  }
}
