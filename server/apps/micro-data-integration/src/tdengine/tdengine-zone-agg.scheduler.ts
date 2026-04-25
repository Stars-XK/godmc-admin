import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '@app/shared';
import { TdengineZoneAggService } from './tdengine-zone-agg.service';

@Injectable()
export class TdengineZoneAggScheduler {
  private readonly logger = new Logger(TdengineZoneAggScheduler.name);
  private readonly dirtySetKey = 'iot:zone_agg:dirty:set';

  constructor(
    private readonly redisService: RedisService,
    private readonly zoneAggService: TdengineZoneAggService,
  ) {}

  // @Cron('*/2 * * * *') // 每 2 分钟执行一次 (已迁移至统一任务管理平台 HTTP调用)
  async processDirtyZones() {
    const redis = this.redisService.getClient();
    const members = await redis.smembers(this.dirtySetKey);
    if (!members || members.length === 0) return;

    // 每次处理最多 50 个分区指标任务
    const batch = members.slice(0, 50);
    for (const item of batch) {
      const [zoneCode, metricType] = item.split('|');
      if (!zoneCode || !metricType) {
        await redis.srem(this.dirtySetKey, item);
        continue;
      }

      const rangeKey = `iot:zone_agg:dirty:range:${zoneCode}|${metricType}`;
      const range = await redis.hgetall(rangeKey);
      const minTs = range?.minTs ? parseInt(range.minTs, 10) : NaN;
      const maxTs = range?.maxTs ? parseInt(range.maxTs, 10) : NaN;

      if (!Number.isFinite(minTs) || !Number.isFinite(maxTs)) {
        await redis.srem(this.dirtySetKey, item);
        await redis.del(rangeKey);
        continue;
      }

      try {
        await this.zoneAggService.rebuildZoneAggTables(zoneCode, metricType, minTs, maxTs);
        await redis.srem(this.dirtySetKey, item);
        await redis.del(rangeKey);
      } catch (e) {
        this.logger.warn(`分区聚合补算失败，将在下轮重试: ${zoneCode}|${metricType} ${e?.message || e}`);
      }
    }
  }
}
