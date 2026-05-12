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
  // 活跃报警设备追踪：key = `alarm:active:{ruleId}:{deviceId}`, value = historyId
  private readonly ACTIVE_ALARM_PREFIX = 'alarm:active:';

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

    // SUCCESS HANDLER (Rule Matched → 触发报警)
    this.engine.on('success', async (event, almanac, ruleResult) => {
      const actions = event?.params?.ruleActions || {};
      const debounce = actions.debounce;

      let deviceId = 'global';
      try { deviceId = await almanac.factValue('deviceId') || await almanac.factValue('zoneCode') || 'global'; } catch(e) {}

      let factValue = 'unknown';
      try { factValue = await almanac.factValue('value'); } catch(e) {}

      const ruleId = event?.params?.ruleId;
      const ruleName = event?.params?.ruleName || 'Unknown';

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
            await this.fireAlarm(ruleId, ruleName, deviceId, factValue);
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
              await this.fireAlarm(ruleId, ruleName, deviceId, factValue);
            }
          }
        }
      } else {
        // Immediate alarm
        await this.fireAlarm(ruleId, ruleName, deviceId, factValue);
      }
    });

    // FAILURE HANDLER (Rule Not Matched → 检查是否需要恢复通知)
    this.engine.on('failure', async (event, almanac, _ruleResult) => {
      const actions = event?.params?.ruleActions || {};
      const debounce = actions.debounce;

      let deviceId = 'global';
      try { deviceId = await almanac.factValue('deviceId') || await almanac.factValue('zoneCode') || 'global'; } catch(e) {}

      const ruleId = event?.params?.ruleId;
      const ruleName = event?.params?.ruleName || 'Unknown';

      // 清理防抖状态
      if (debounce && debounce.enabled) {
        if (debounce.strategy === 'count') {
          await this.redisService.getClient().del(`alarm:window:${ruleId}:${deviceId}`);
        } else if (debounce.strategy === 'time') {
          await this.redisService.getClient().del(`alarm:state:${ruleId}:${deviceId}`);
        }
      }

      // 检查是否有活跃报警，若有则记录恢复事件
      await this.tryRecovery(ruleId, ruleName, deviceId);
    });

    this.logger.log(`[Alarm Engine] 规则加载完成，已加载 ${rules.length} 条活跃规则`);
  }

  /**
   * 触发报警
   */
  private async fireAlarm(ruleId: number, ruleName: string, deviceId: string, factValue: any) {
    // 防重复：检查是否已有该规则+设备的活跃报警
    const activeKey = `${this.ACTIVE_ALARM_PREFIX}${ruleId}:${deviceId}`;
    const existingId = await this.redisService.getClient().get(activeKey);
    if (existingId) {
      this.logger.debug(`跳过重复报警: rule=${ruleName}, device=${deviceId} (已有活跃报警 #${existingId})`);
      return;
    }

    this.logger.warn(`[Alarm] 触发: rule=${ruleName}, device=${deviceId}, value=${factValue}`);

    const history = this.historyRep.create({
      ruleId: ruleId,
      ruleName: ruleName,
      alarmLevel: '2',
      alarmContent: `触发报警规则: ${ruleName}, 设备: ${deviceId}, 检测值: ${factValue}`,
      alarmTime: new Date(),
      alarmSource: deviceId,
      status: '0', // 未处理
    });
    const saved = await this.historyRep.save(history);

    // 记录活跃报警
    await this.redisService.getClient().set(activeKey, String(saved.alarmId), 'EX', 86400 * 7); // 7天过期
  }

  /**
   * 尝试恢复通知：检查是否有活跃报警，若有则标记为自动恢复
   */
  private async tryRecovery(ruleId: number, ruleName: string, deviceId: string) {
    const activeKey = `${this.ACTIVE_ALARM_PREFIX}${ruleId}:${deviceId}`;
    const historyIdStr = await this.redisService.getClient().get(activeKey);

    if (!historyIdStr) {
      return; // 没有活跃报警，无需恢复
    }

    const historyId = parseInt(historyIdStr, 10);

    try {
      const history = await this.historyRep.findOne({ where: { alarmId: historyId } });
      if (!history || history.status !== '0') {
        // 报警已被手动处理或不存在，清除活跃标记
        await this.redisService.getClient().del(activeKey);
        return;
      }

      // 记录恢复事件（新建一条历史记录，状态为 2=自动恢复）
      const recovery = this.historyRep.create({
        ruleId: ruleId,
        ruleName: ruleName,
        alarmLevel: '4', // 提示级别
        alarmContent: `报警自动恢复: ${ruleName}, 设备: ${deviceId} 已恢复正常`,
        alarmTime: new Date(),
        alarmSource: deviceId,
        status: '2', // 自动恢复
      });
      await this.historyRep.save(recovery);

      // 将原报警标记为已恢复
      history.status = '2';
      await this.historyRep.save(history);

      // 清除活跃标记
      await this.redisService.getClient().del(activeKey);

      this.logger.log(`[Alarm] 恢复: rule=${ruleName}, device=${deviceId} (原报警 #${historyId})`);
    } catch (e) {
      this.logger.error(`处理恢复通知失败: rule=${ruleName}, device=${deviceId}`, e);
    }
  }

  /**
   * 评估事实数据
   */
  async evaluate(facts: Record<string, any>) {
    if (!this.engine) {
      this.logger.warn('Engine not initialized yet');
      return null;
    }
    // 跳过内部 ping 检测
    if (facts._ping) {
      return null;
    }
    return this.engine.run(facts);
  }
}
