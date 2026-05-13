import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '@app/shared/redis/redis.service';
import { TdengineService } from './tdengine.service';
import { SysConfigEntity } from '@app/common';

@Injectable()
export class TdengineRetryScheduler {
  private readonly logger = new Logger(TdengineRetryScheduler.name);
  private readonly retryListKey = 'iot:td:retry:list';
  private readonly dirtySetKey = 'iot:agg:dirty:set';

  constructor(
    private readonly redisService: RedisService,
    private readonly tdengineService: TdengineService,
    @InjectRepository(SysConfigEntity)
    private readonly sysConfigRep: Repository<SysConfigEntity>,
  ) {}

  private async markAggDirty(deviceCode: string, pointCode: string, tsMs: number) {
    const redis = this.redisService.getClient();
    const member = `${deviceCode}|${pointCode}`;
    const rangeKey = `iot:agg:dirty:range:${member}`;

    await redis.sadd(this.dirtySetKey, member);

    const range = await redis.hgetall(rangeKey);
    const minTs = range?.minTs ? parseInt(range.minTs, 10) : tsMs;
    const maxTs = range?.maxTs ? parseInt(range.maxTs, 10) : tsMs;

    await redis.hset(rangeKey, {
      minTs: String(Math.min(minTs, tsMs)),
      maxTs: String(Math.max(maxTs, tsMs)),
    });
  }

  @Cron('*/10 * * * * *')
  async replayFailedInserts() {
    if (!await this.isBuiltInEnabled()) return;

    const redis = this.redisService.getClient();

    for (let i = 0; i < 200; i++) {
      const raw = await redis.rpop(this.retryListKey);
      if (!raw) return;

      let item: any;
      try {
        item = JSON.parse(raw);
      } catch {
        continue;
      }

      const deviceCode = String(item.deviceCode || '');
      const pointCode = String(item.pointCode || '');
      const val = Number(item.val);
      const ts = item.ts ? new Date(item.ts) : new Date();

      if (!deviceCode || !pointCode || !Number.isFinite(val)) continue;

      try {
        await this.tdengineService.insertData(deviceCode, pointCode, val, ts);
        await redis.hset('iot:point:active', pointCode, Date.now().toString());
        await this.markAggDirty(deviceCode, pointCode, ts.getTime());
      } catch (e) {
        await redis.lpush(this.retryListKey, raw);
        this.logger.warn(`TDengine 重放失败，将重试: ${deviceCode}|${pointCode} ${e?.message || e}`);
        return;
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
