import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '@app/shared';
import { TdengineAggService } from './tdengine-agg.service';

@Injectable()
export class TdengineAggScheduler {
  private readonly logger = new Logger(TdengineAggScheduler.name);
  private readonly dirtySetKey = 'iot:agg:dirty:set';

  constructor(
    private readonly redisService: RedisService,
    private readonly aggService: TdengineAggService,
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
      } catch (e) {
        this.logger.warn(`聚合补算失败，将在下轮重试: ${deviceCode}|${pointCode} ${e?.message || e}`);
      }
    }
  }
}

