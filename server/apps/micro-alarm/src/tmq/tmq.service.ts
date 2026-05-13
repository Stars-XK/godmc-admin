import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TdengineService } from '../tdengine/tdengine.service';
import { EngineService } from '../engine/engine.service';

/**
 * TMQ 消费者 — 定时 REST 轮询模式。
 *
 * 轮询目标：
 * - water_iot.meters_5m    → 设备级聚合数据（每 30 秒）
 * - water_iot.zone_meters_5m → 分区级聚合数据（每 30 秒）
 *
 * 每条事实携带 targetType + targetKey，报警引擎通过规则索引 O(1) 查找相关规则。
 */
@Injectable()
export class TmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TmqService.name);
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private lastDevicePollTs: Date = new Date(0);
  private lastZonePollTs: Date = new Date(0);

  constructor(
    private readonly tdengineService: TdengineService,
    private readonly engineService: EngineService,
  ) {}

  async onModuleInit() {
    this.logger.log('[TMQ Poller] 启动定时轮询，间隔 30 秒');
    await this.pollAndEvaluate();
    this.pollingTimer = setInterval(() => {
      this.pollAndEvaluate().catch(e => {
        this.logger.error(`[TMQ Poller] 轮询异常: ${e.message}`);
      });
    }, 30000);
  }

  onModuleDestroy() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.logger.log('[TMQ Poller] 已停止');
  }

  /**
   * 轮询设备 + 分区聚合数据，推送给报警引擎
   */
  private async pollAndEvaluate(): Promise<void> {
    await Promise.all([
      this.pollDeviceData(),
      this.pollZoneData(),
    ]);
  }

  /**
   * 轮询设备级聚合数据 (meters_5m)
   */
  private async pollDeviceData(): Promise<void> {
    try {
      const rows = await this.tdengineService.getRecentAggregatedData(5);
      const newRows = rows.filter(row => {
        const rowTs = row.ts instanceof Date ? row.ts : new Date(row.ts);
        return rowTs > this.lastDevicePollTs;
      });

      if (newRows.length === 0) return;

      this.logger.debug(`[TMQ Poller] 设备数据: ${newRows.length} 条新记录`);

      const evaluated = new Set<string>();
      for (const row of newRows) {
        const key = `${row.deviceCode}:${row.pointCode}`;
        if (evaluated.has(key)) continue;
        evaluated.add(key);

        const facts = {
          deviceId: row.deviceCode,
          deviceCode: row.deviceCode,
          pointCode: row.pointCode,
          value: row.avgVal,
          avgVal: row.avgVal,
          maxVal: row.maxVal,
          minVal: row.minVal,
          spreadVal: row.spreadVal,
          diffVal: row.diffVal,
          ts: row.ts,
        };

        await this.engineService.evaluate(facts, 'device', row.deviceCode).catch(e => {
          this.logger.error(`设备评估失败 device=${row.deviceCode}`, e);
        });
      }

      const latestRow = newRows.reduce((a, b) => {
        const aTs = a.ts instanceof Date ? a.ts.getTime() : new Date(a.ts).getTime();
        const bTs = b.ts instanceof Date ? b.ts.getTime() : new Date(b.ts).getTime();
        return aTs > bTs ? a : b;
      });
      this.lastDevicePollTs = latestRow.ts instanceof Date ? latestRow.ts : new Date(latestRow.ts);
    } catch (e) {
      this.logger.warn(`[TMQ Poller] 设备数据轮询失败: ${e.message}`);
    }
  }

  /**
   * 轮询分区级聚合数据 (zone_meters_5m)
   */
  private async pollZoneData(): Promise<void> {
    try {
      const rows = await this.tdengineService.getRecentZoneAggregatedData(5);
      const newRows = rows.filter(row => {
        const rowTs = row.ts instanceof Date ? row.ts : new Date(row.ts);
        return rowTs > this.lastZonePollTs;
      });

      if (newRows.length === 0) return;

      this.logger.debug(`[TMQ Poller] 分区数据: ${newRows.length} 条新记录`);

      const evaluated = new Set<string>();
      for (const row of newRows) {
        const key = `${row.zoneCode}:${row.pointCode}`;
        if (evaluated.has(key)) continue;
        evaluated.add(key);

        const facts = {
          zoneCode: row.zoneCode,
          pointCode: row.pointCode,
          value: row.avgVal,
          avgVal: row.avgVal,
          maxVal: row.maxVal,
          minVal: row.minVal,
          spreadVal: row.spreadVal,
          diffVal: row.diffVal,
          ts: row.ts,
        };

        await this.engineService.evaluate(facts, 'zone', row.zoneCode).catch(e => {
          this.logger.error(`分区评估失败 zone=${row.zoneCode}`, e);
        });
      }

      const latestRow = newRows.reduce((a, b) => {
        const aTs = a.ts instanceof Date ? a.ts.getTime() : new Date(a.ts).getTime();
        const bTs = b.ts instanceof Date ? b.ts.getTime() : new Date(b.ts).getTime();
        return aTs > bTs ? a : b;
      });
      this.lastZonePollTs = latestRow.ts instanceof Date ? latestRow.ts : new Date(latestRow.ts);
    } catch (e) {
      this.logger.warn(`[TMQ Poller] 分区数据轮询失败: ${e.message}`);
    }
  }

  /**
   * 外部调用接口：手动触发单条数据评估（兼容旧 TMQ processMessage 签名）
   */
  public async processMessage(msg: any): Promise<void> {
    try {
      const topic = msg.topic;
      for (const row of msg.data || []) {
        const deviceId = row.device_id?.toString() || row.deviceCode || 'unknown';
        const metricName = row.metric_name?.toString() || row.pointCode || 'unknown';

        let factValue = row.val_ma || row.avgVal || row.val || 0;

        if (topic === 'topic_alarm_slope') {
          factValue = row.val_slope || row.slopeVal || factValue;
        } else if (topic === 'topic_alarm_diff') {
          factValue = row.val_diff || row.diffVal || factValue;
        }

        const facts = {
          deviceId,
          deviceCode: deviceId,
          pointCode: metricName,
          value: factValue,
        };

        this.logger.debug(`评估 TMQ 事件: ${deviceId}: ${metricName} = ${factValue}`);
        await this.engineService.evaluate(facts, 'device', deviceId);
      }
    } catch (e) {
      this.logger.error('处理 TMQ 消息失败', e);
    }
  }
}
