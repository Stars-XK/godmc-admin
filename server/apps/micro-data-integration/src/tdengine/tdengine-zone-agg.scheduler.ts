import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '@app/shared';
import { TdengineZoneAggService } from './tdengine-zone-agg.service';
import { SysConfigEntity } from '@app/common';

@Injectable()
export class TdengineZoneAggScheduler {
  private readonly logger = new Logger(TdengineZoneAggScheduler.name);
  private readonly dirtySetKey = 'iot:zone_agg:dirty:set';

  constructor(
    private readonly redisService: RedisService,
    private readonly zoneAggService: TdengineZoneAggService,
    @InjectRepository(SysConfigEntity)
    private readonly sysConfigRep: Repository<SysConfigEntity>,
  ) {}

  @Cron('*/2 * * * *')
  async processDirtyZones() {
    if (!await this.isBuiltInEnabled()) return;

    const redis = this.redisService.getClient();
    const members = await redis.smembers(this.dirtySetKey);
    if (!members || members.length === 0) return;

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

  private async isBuiltInEnabled(): Promise<boolean> {
    try {
      const conf = await this.sysConfigRep.findOne({ where: { configKey: 'scheduler.builtInEnabled' } });
      if (conf && conf.configValue === 'false') return false;
    } catch {}
    return true;
  }
}
