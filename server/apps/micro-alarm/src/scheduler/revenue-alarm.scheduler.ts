import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TdengineService } from '../tdengine/tdengine.service';
import { EngineService } from '../engine/engine.service';

/**
 * 产销差/营收指标报警定时器
 *
 * 每日凌晨 2:00 检查分区营收数据（日/月），
 * 将结果作为事实推送给报警引擎评估。
 */
@Injectable()
export class RevenueAlarmScheduler {
  private readonly logger = new Logger(RevenueAlarmScheduler.name);

  constructor(
    private readonly tdengineService: TdengineService,
    private readonly engineService: EngineService,
  ) {}

  /**
   * 每日凌晨 2:07 检查昨日分区营收数据
   */
  @Cron('7 2 * * *')
  async checkDailyRevenueAlarms() {
    this.logger.log('[RevenueAlarm] 开始检查日营收报警...');
    try {
      const rows = await this.tdengineService.getRecentZoneRevenueData('1d', 2);
      await this.evaluateRows(rows, 'zone');
    } catch (e) {
      this.logger.error(`[RevenueAlarm] 日营收报警检查失败: ${e.message}`);
    }
  }

  /**
   * 每月 2 号凌晨 2:17 检查上月分区营收数据
   */
  @Cron('17 2 2 * *')
  async checkMonthlyRevenueAlarms() {
    this.logger.log('[RevenueAlarm] 开始检查月营收报警...');
    try {
      const rows = await this.tdengineService.getRecentZoneRevenueData('1mo', 2);
      await this.evaluateRows(rows, 'zone');
    } catch (e) {
      this.logger.error(`[RevenueAlarm] 月营收报警检查失败: ${e.message}`);
    }
  }

  private async evaluateRows(rows: any[], targetType: 'zone' | 'device') {
    if (rows.length === 0) return;

    const evaluated = new Set<string>();
    for (const row of rows) {
      const targetKey = row.zoneCode || row.deviceCode;
      if (!targetKey) continue;

      const key = `${targetKey}:${row.pointCode || 'revenue'}`;
      if (evaluated.has(key)) continue;
      evaluated.add(key);

      const facts = {
        zoneCode: targetKey,
        totalVal: row.totalVal,
        avgVal: row.avgVal,
        ts: row.ts,
        value: row.totalVal || row.avgVal || 0,
      };

      await this.engineService.evaluate(facts, targetType, targetKey).catch(e => {
        this.logger.error(`营收报警评估失败 target=${targetKey}`, e);
      });
    }
  }
}
