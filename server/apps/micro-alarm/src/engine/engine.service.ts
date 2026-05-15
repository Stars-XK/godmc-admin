import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Engine } from 'json-rules-engine';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysAlarmRuleEntity, SysAlarmHistoryEntity } from '@app/common';
import { RedisService } from '@app/shared';
import { NotifyService } from '../notify/notify.service';

interface IndexedRule {
  ruleId: number;
  ruleName: string;
  conditions: any;
  actions: any;
  entity: SysAlarmRuleEntity;
}

@Injectable()
export class EngineService implements OnModuleInit {
  private readonly logger = new Logger(EngineService.name);
  private readonly ACTIVE_ALARM_PREFIX = 'alarm:active:';

  /**
   * 规则索引：按目标键快速查找相关规则
   * key: "device:<code>" | "zone:<code>" | "__all_devices__" | "__all_zones__" | "__system__"
   */
  private ruleIndex: Map<string, IndexedRule[]> = new Map();

  constructor(
    @InjectRepository(SysAlarmRuleEntity)
    private readonly ruleRep: Repository<SysAlarmRuleEntity>,
    @InjectRepository(SysAlarmHistoryEntity)
    private readonly historyRep: Repository<SysAlarmHistoryEntity>,
    private readonly redisService: RedisService,
    private readonly notifyService: NotifyService,
  ) {}

  async onModuleInit() {
    await this.reloadEngine();
  }

  /**
   * 重载规则引擎：从数据库加载所有活跃规则，构建目标索引
   *
   * 索引策略：
   * - device:<code> → 作用域为指定设备的规则
   * - zone:<code>  → 作用域为指定分区的规则
   * - __all_devices__ → 作用于全部设备的规则
   * - __all_zones__  → 作用于全部分区的规则
   * - __system__     → 系统级规则
   *
   * 一条规则可能出现在多个索引键下（如 all_devices 规则对所有设备都生效）
   */
  async reloadEngine() {
    const rules = await this.ruleRep.find({ where: { status: '0' } });
    const newIndex = new Map<string, IndexedRule[]>();

    for (const entity of rules) {
      try {
        const conditions = typeof entity.ruleConditions === 'string'
          ? JSON.parse(entity.ruleConditions) : entity.ruleConditions;
        const actions = typeof entity.ruleActions === 'string'
          ? JSON.parse(entity.ruleActions) : entity.ruleActions;

        const indexed: IndexedRule = {
          ruleId: entity.ruleId,
          ruleName: entity.ruleName,
          conditions,
          actions,
          entity,
        };

        const scopeType = entity.scopeType || 'device';
        const scopeValue = entity.scopeValue || '';

        this.addToIndex(newIndex, indexed, scopeType, scopeValue);
      } catch (e) {
        this.logger.error(`Failed to index rule ${entity.ruleId}`, e);
      }
    }

    this.ruleIndex = newIndex;
    this.logger.log(
      `[Alarm Engine] 规则索引重建完成，${rules.length} 条规则 → ${newIndex.size} 个索引键`,
    );
  }

  /**
   * 将规则添加到索引的对应键下
   */
  private addToIndex(
    index: Map<string, IndexedRule[]>,
    rule: IndexedRule,
    scopeType: string,
    scopeValue: string,
  ) {
    const add = (key: string) => {
      if (!index.has(key)) index.set(key, []);
      index.get(key)!.push(rule);
    };

    switch (scopeType) {
      case 'device': {
        // 指定设备列表，逗号分隔
        const codes = scopeValue.split(',').map(s => s.trim()).filter(Boolean);
        for (const code of codes) {
          add(`device:${code}`);
        }
        break;
      }
      case 'zone': {
        const codes = scopeValue.split(',').map(s => s.trim()).filter(Boolean);
        for (const code of codes) {
          add(`zone:${code}`);
        }
        break;
      }
      case 'device_group': {
        // 设备组：每个组名作为一个索引键，TMQ 侧根据设备所属组查找
        const groups = scopeValue.split(',').map(s => s.trim()).filter(Boolean);
        for (const g of groups) {
          add(`device_group:${g}`);
        }
        break;
      }
      case 'all_devices': {
        add('__all_devices__');
        break;
      }
      case 'all_zones': {
        add('__all_zones__');
        break;
      }
      default: {
        // 兼容旧数据：无 scope 的规则按系统级处理
        add('__system__');
      }
    }

    // 系统级规则 (rule_type=3) 额外加到 __system__
    if (rule.entity.ruleType === '3') {
      add('__system__');
    }
  }

  /**
   * 获取某个目标需要评估的规则列表
   */
  private getRulesForTarget(
    targetType: 'device' | 'zone' | 'system',
    targetKey?: string,
  ): IndexedRule[] {
    const rules: IndexedRule[] = [];
    const seen = new Set<number>();

    const addUnique = (list: IndexedRule[]) => {
      for (const r of list) {
        if (!seen.has(r.ruleId)) {
          seen.add(r.ruleId);
          rules.push(r);
        }
      }
    };

    // 全局规则总是适用
    addUnique(this.ruleIndex.get('__system__') || []);

    if (targetType === 'device') {
      addUnique(this.ruleIndex.get('__all_devices__') || []);
      if (targetKey) {
        addUnique(this.ruleIndex.get(`device:${targetKey}`) || []);
        // 也检查设备组 (如果 TMQ 传递了组信息可在 facts 中携带)
      }
    } else if (targetType === 'zone') {
      addUnique(this.ruleIndex.get('__all_zones__') || []);
      if (targetKey) {
        addUnique(this.ruleIndex.get(`zone:${targetKey}`) || []);
      }
    }

    return rules;
  }

  /**
   * 评估事实数据 — 核心方法
   *
   * @param facts    事实数据 (deviceId, zoneCode, value, pointCode, avgVal, maxVal, minVal 等)
   * @param targetType 目标类型 'device' | 'zone' | 'system'
   * @param targetKey  目标标识 (deviceCode 或 zoneCode)
   */
  async evaluate(
    facts: Record<string, any>,
    targetType: 'device' | 'zone' | 'system' = 'device',
    targetKey?: string,
  ) {
    // 跳过内部 ping 检测
    if (facts._ping) {
      return null;
    }

    if (this.ruleIndex.size === 0) {
      this.logger.warn('[Alarm Engine] 规则索引为空，跳过评估');
      return null;
    }

    // 尝试从 facts 中推导目标信息（兼容旧调用方式）
    if (!targetKey) {
      if (targetType === 'device') {
        targetKey = facts.deviceId || facts.deviceCode;
      } else if (targetType === 'zone') {
        targetKey = facts.zoneCode;
      }
    }

    const relevantRules = this.getRulesForTarget(targetType, targetKey);

    if (relevantRules.length === 0) {
      return null; // 没有规则匹配此目标，快速返回
    }

    // 创建临时引擎，只加载相关规则
    const engine = new Engine();
    const ruleMetaMap = new Map<number, IndexedRule>();

    for (const indexed of relevantRules) {
      engine.addRule({
        conditions: indexed.conditions,
        event: {
          type: 'alarm_triggered',
          params: {
            ruleId: indexed.ruleId,
            ruleName: indexed.ruleName,
            ruleActions: indexed.actions,
          },
        },
      });
      ruleMetaMap.set(indexed.ruleId, indexed);
    }

    // 确定目标标识用于防抖键
    const deviceId = targetType === 'device'
      ? (targetKey || facts.deviceId || facts.deviceCode || 'global')
      : (targetKey || facts.zoneCode || 'global');

    // SUCCESS HANDLER — 规则命中
    engine.on('success', async (event, almanac) => {
      const actions = event?.params?.ruleActions || {};
      const debounce = actions.debounce;
      const ruleId = event?.params?.ruleId;
      const ruleName = event?.params?.ruleName || 'Unknown';

      let factValue = 'unknown';
      try { factValue = await almanac.factValue('value'); } catch (e) {}

      await this.handleRuleMatch(ruleId, ruleName, deviceId, factValue, debounce);
    });

    // FAILURE HANDLER — 规则未命中
    engine.on('failure', async (event) => {
      const actions = event?.params?.ruleActions || {};
      const debounce = actions.debounce;
      const ruleId = event?.params?.ruleId;
      const ruleName = event?.params?.ruleName || 'Unknown';

      await this.handleRuleMismatch(ruleId, ruleName, deviceId, debounce);
    });

    try {
      await engine.run(facts);
    } catch (e) {
      this.logger.error(`[Alarm Engine] 规则评估异常 target=${targetType}:${targetKey}`, e);
    }
  }

  /**
   * 处理规则命中：防抖判断 → 触发报警
   */
  private async handleRuleMatch(
    ruleId: number,
    ruleName: string,
    deviceId: string,
    factValue: any,
    debounce?: { enabled?: boolean; strategy?: string; threshold?: number },
  ) {
    if (debounce && debounce.enabled) {
      const threshold = debounce.threshold || 1;
      const now = Date.now();

      if (debounce.strategy === 'count') {
        const key = `alarm:window:${ruleId}:${deviceId}`;
        const firedKey = `alarm:fired:${ruleId}:${deviceId}`;
        // 检查是否已触发过，防止同一轮窗口内重复触发
        const alreadyFired = await this.redisService.getClient().get(firedKey);
        if (alreadyFired) return;

        const eventId = `${now}-${Math.random().toString(36).substring(7)}`;
        await this.redisService.getClient().zadd(key, now, eventId);
        await this.redisService.getClient().expire(key, 3600);

        const count = await this.redisService.getClient().zcard(key);
        if (count >= threshold) {
          // SETNX 防并发：同一规则+设备在窗口内只触发一次
          const doFire = await this.redisService.getClient().set(firedKey, '1', 'NX', 'EX', 3600);
          if (!doFire) return;
          await this.redisService.getClient().del(key);
          await this.fireAlarm(ruleId, ruleName, deviceId, factValue);
        }
        return;
      }

      if (debounce.strategy === 'time') {
        const key = `alarm:state:${ruleId}:${deviceId}`;
        const existingTime = await this.redisService.getClient().get(key);

        if (!existingTime) {
          await this.redisService.getClient().set(key, now, 'EX', threshold * 60 * 2);
        } else {
          const diffMinutes = (now - parseInt(existingTime, 10)) / (1000 * 60);
          if (diffMinutes >= threshold) {
            await this.redisService.getClient().del(key);
            await this.fireAlarm(ruleId, ruleName, deviceId, factValue);
          }
        }
        return;
      }
    }

    // 无防抖，直接触发
    await this.fireAlarm(ruleId, ruleName, deviceId, factValue);
  }

  /**
   * 处理规则未命中：清理防抖状态 → 检查恢复
   */
  private async handleRuleMismatch(
    ruleId: number,
    ruleName: string,
    deviceId: string,
    debounce?: { enabled?: boolean; strategy?: string },
  ) {
    if (debounce && debounce.enabled) {
      if (debounce.strategy === 'count') {
        await this.redisService.getClient().del(`alarm:window:${ruleId}:${deviceId}`);
      } else if (debounce.strategy === 'time') {
        await this.redisService.getClient().del(`alarm:state:${ruleId}:${deviceId}`);
      }
    }

    await this.tryRecovery(ruleId, ruleName, deviceId);
  }

  /**
   * 触发报警：使用 SETNX 原子化去重，防止并发重复报警
   */
  private async fireAlarm(ruleId: number, ruleName: string, deviceId: string, factValue: any) {
    const activeKey = `${this.ACTIVE_ALARM_PREFIX}${ruleId}:${deviceId}`;

    // 使用 SETNX 原子操作防竞态：先占位，防止并发创建重复报警记录
    const acquired = await this.redisService.getClient().set(activeKey, 'pending', 'NX', 'EX', 10);
    if (!acquired) {
      this.logger.debug(`跳过重复报警: rule=${ruleName}, target=${deviceId} (已有活跃报警)`);
      return;
    }

    this.logger.warn(`[Alarm] 触发: rule=${ruleName}, target=${deviceId}, value=${factValue}`);

    const history = this.historyRep.create({
      ruleId,
      ruleName,
      alarmLevel: '2',
      alarmContent: `触发报警规则: ${ruleName}, 目标: ${deviceId}, 检测值: ${factValue}`,
      alarmTime: new Date(),
      alarmSource: deviceId,
      status: '0',
    });
    const saved = await this.historyRep.save(history);

    // 更新占位符为真实的 alarmId
    await this.redisService.getClient().set(activeKey, String(saved.alarmId), 'XX', 'EX', 86400 * 7);

    this.notifyService.sendAlarmNotification({
      ruleId, ruleName, alarmLevel: '2', alarmContent: saved.alarmContent,
      alarmSource: deviceId, alarmTime: saved.alarmTime, status: '0',
    }).catch(e => this.logger.error(`通知发送异常: ${e?.message || e}`));
  }

  /**
   * 尝试恢复：检查是否有活跃报警，若有则标记为自动恢复
   */
  private async tryRecovery(ruleId: number, ruleName: string, deviceId: string) {
    const activeKey = `${this.ACTIVE_ALARM_PREFIX}${ruleId}:${deviceId}`;
    const historyIdStr = await this.redisService.getClient().get(activeKey);

    if (!historyIdStr || historyIdStr === 'pending') return;

    const historyId = parseInt(historyIdStr, 10);

    try {
      const history = await this.historyRep.findOne({ where: { alarmId: historyId } });
      if (!history || history.status !== '0') {
        // 报警已处理或不存在，清理 activeKey
        await this.redisService.getClient().del(activeKey);
        return;
      }

      // 在删除 activeKey 前再次验证 key 值未被新报警覆盖
      const currentIdStr = await this.redisService.getClient().get(activeKey);
      if (currentIdStr !== historyIdStr) {
        // activeKey 已被新报警覆盖，不做恢复处理
        this.logger.debug(`跳过恢复: activeKey 已变更 rule=${ruleName} target=${deviceId}`);
        return;
      }

      // 在原记录上直接更新恢复信息，不创建独立记录
      history.status = '2';
      history.recoveryTime = new Date();
      history.alarmContent = history.alarmContent + ` [自动恢复于 ${new Date().toISOString()}]`;
      await this.historyRep.save(history);

      await this.redisService.getClient().del(activeKey);

      this.logger.log(`[Alarm] 恢复: rule=${ruleName}, target=${deviceId} (报警 #${historyId})`);

      this.notifyService.sendAlarmNotification({
        ruleId, ruleName, alarmLevel: '4', alarmContent: history.alarmContent,
        alarmSource: deviceId, alarmTime: new Date(), status: '2',
      }).catch(e => this.logger.error(`恢复通知发送异常: ${e?.message || e}`));
    } catch (e) {
      this.logger.error(`处理恢复通知失败: rule=${ruleName}, target=${deviceId}`, e);
    }
  }
}
