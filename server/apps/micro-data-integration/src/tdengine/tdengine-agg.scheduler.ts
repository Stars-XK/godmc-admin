import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '@app/shared';
import { TdengineAggService } from './tdengine-agg.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterZoneMetricCalcEntity } from '@app/common';

@Injectable()
export class TdengineAggScheduler {
  private readonly logger = new Logger(TdengineAggScheduler.name);
  private readonly dirtySetKey = 'iot:agg:dirty:set';
  private readonly zoneDirtySetKey = 'iot:zone_agg:dirty:set';

  constructor(
    private readonly redisService: RedisService,
    private readonly aggService: TdengineAggService,
    @InjectRepository(WaterZoneMetricCalcEntity)
    private readonly zoneMetricRep: Repository<WaterZoneMetricCalcEntity>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processDirtyPoints() {
    const redis = this.redisService.getClient();
    const members = await redis.smembers(this.dirtySetKey);
    if (!members || members.length === 0) return;

    const batch = members.slice(0, 50);
    for (const item of batch) {
      const [deviceCode, pointCode] = item.split('|');
      if (!deviceCode || !pointCode) {
        await redis.srem(this.dirtySetKey, item);
        continue;
      }

      const rangeKey = `iot:agg:dirty:range:${deviceCode}|${pointCode}`;
      const range = await redis.hgetall(rangeKey);
      const minTs = range?.minTs ? parseInt(range.minTs, 10) : NaN;
      const maxTs = range?.maxTs ? parseInt(range.maxTs, 10) : NaN;

      if (!Number.isFinite(minTs) || !Number.isFinite(maxTs)) {
        await redis.srem(this.dirtySetKey, item);
        await redis.del(rangeKey);
        continue;
      }

      try {
        await this.aggService.rebuildAggTables(deviceCode, pointCode, minTs, maxTs);
        await redis.srem(this.dirtySetKey, item);
        await redis.del(rangeKey);

        // 联动触发分区聚合脏数据
        await this.triggerZoneAgg(pointCode, minTs, maxTs);
      } catch (e) {
        this.logger.warn(`聚合补算失败，将在下轮重试: ${deviceCode}|${pointCode} ${e?.message || e}`);
      }
    }
  }

  /**
   * 将受影响的分区指标压入脏数据队列
   */
  private async triggerZoneAgg(pointCode: string, minTs: number, maxTs: number) {
    try {
      const configs = await this.zoneMetricRep.find({ where: { pointCode, delFlag: '0' } });
      if (!configs || configs.length === 0) return;

      const redis = this.redisService.getClient();
      for (const config of configs) {
        const itemKey = `${config.zoneCode}|${config.metricType}`;
        const rangeKey = `iot:zone_agg:dirty:range:${itemKey}`;

        await redis.sadd(this.zoneDirtySetKey, itemKey);

        const currentRange = await redis.hgetall(rangeKey);
        const currentMin = currentRange?.minTs ? parseInt(currentRange.minTs, 10) : Infinity;
        const currentMax = currentRange?.maxTs ? parseInt(currentRange.maxTs, 10) : -Infinity;

        const newMin = Math.min(currentMin, minTs);
        const newMax = Math.max(currentMax, maxTs);

        await redis.hmset(rangeKey, 'minTs', newMin.toString(), 'maxTs', newMax.toString());
      }
    } catch (error) {
      this.logger.error(`触发分区聚合联动失败: pointCode=${pointCode}`, error);
    }
  }
}

