import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TdengineService } from '../tdengine/tdengine.service';
import { EngineService } from '../engine/engine.service';

/**
 * TMQ 消费者 — 已从原生 TDengine TMQ 客户端模式改为定时 REST 轮询模式。
 * 
 * 原因：项目未安装 @tdengine/client 原生驱动，无法使用 WebSocket/TMQ 订阅。
 * 替代方案：每 30 秒查询 water_iot.meters_5m 聚合表，将最新数据推送给报警引擎评估。
 */
@Injectable()
export class TmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TmqService.name);
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private lastPollTs: Date = new Date(0); // 上次轮询的时间戳，避免重复评估

  constructor(
    private readonly tdengineService: TdengineService,
    private readonly engineService: EngineService,
  ) {}

  async onModuleInit() {
    this.logger.log('[TMQ Poller] 启动定时轮询，间隔 30 秒，目标表: water_iot.meters_5m');
    // 启动时立即执行一次
    await this.pollAndEvaluate();
    // 每 30 秒轮询一次
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
   * 从 meters_5m 表拉取最近 5 分钟的聚合数据并推送给报警引擎
   */
  private async pollAndEvaluate(): Promise<void> {
    try {
      const rows = await this.tdengineService.getRecentAggregatedData(5);

      if (rows.length === 0) {
        return; // 无新数据，跳过
      }

      // 过滤出上次轮询之后的新数据
      const newRows = rows.filter(row => {
        const rowTs = row.ts instanceof Date ? row.ts : new Date(row.ts);
        return rowTs > this.lastPollTs;
      });

      if (newRows.length === 0) {
        return;
      }

      this.logger.debug(`[TMQ Poller] 发现 ${newRows.length} 条新聚合数据，推送给报警引擎`);

      // 按设备分组，每个 (deviceCode, pointCode) 生成一组 facts
      const evaluated = new Set<string>();

      for (const row of newRows) {
        const key = `${row.deviceCode}:${row.pointCode}`;
        // 同一设备测点在同一轮只评估一次（取最新一条）
        if (evaluated.has(key)) continue;
        evaluated.add(key);

        const facts = {
          deviceId: row.deviceCode,
          pointCode: row.pointCode,
          value: row.avgVal,
          avgVal: row.avgVal,
          maxVal: row.maxVal,
          minVal: row.minVal,
          spreadVal: row.spreadVal,
          diffVal: row.diffVal,
          ts: row.ts,
          // 兼容旧版 TMQ 消息的 fact key 格式
          [`device.${row.pointCode}.ma_5m`]: row.avgVal,
          [`device.${row.pointCode}.spread_5m`]: row.spreadVal,
          [`device.${row.pointCode}.diff_5m`]: row.diffVal,
        };

        try {
          await this.engineService.evaluate(facts);
        } catch (e) {
          this.logger.error(`[TMQ Poller] 评估 facts 失败 device=${row.deviceCode} point=${row.pointCode}`, e);
        }
      }

      // 更新最后轮询时间戳（取最新一条数据的时间）
      const latestRow = newRows.reduce((a, b) => {
        const aTs = a.ts instanceof Date ? a.ts.getTime() : new Date(a.ts).getTime();
        const bTs = b.ts instanceof Date ? b.ts.getTime() : new Date(b.ts).getTime();
        return aTs > bTs ? a : b;
      });
      const latestTs = latestRow.ts instanceof Date ? latestRow.ts : new Date(latestRow.ts);
      this.lastPollTs = latestTs;
    } catch (e) {
      this.logger.warn(`[TMQ Poller] 轮询失败: ${e.message}`);
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
          pointCode: metricName,
          value: factValue,
          [`device.${metricName}.ma_5m`]: row.val_ma || row.avgVal,
          [`device.${metricName}.slope_5m`]: row.val_slope || row.slopeVal,
          [`device.${metricName}.diff_1m`]: row.val_diff || row.diffVal,
        };

        this.logger.debug(`评估 TMQ 事件: ${deviceId}: ${metricName} = ${factValue}`);
        await this.engineService.evaluate(facts);
      }
    } catch (e) {
      this.logger.error('处理 TMQ 消息失败', e);
    }
  }
}
