import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WaterPointEntity, WaterZoneMetricCalcEntity } from '@app/common';
import { TdengineService } from './tdengine.service';
import dayjs from 'dayjs';
import { RedisService } from '@app/shared';

@Injectable()
export class TdengineZoneAggService {
  private readonly logger = new Logger(TdengineZoneAggService.name);
  private readonly zoneMetricCachePrefix = 'iot:zone_agg:cache:zone_metric:';
  private readonly pointDeviceHashKey = 'iot:zone_agg:cache:point_device';

  constructor(
    private readonly tdengineService: TdengineService,
    private readonly redisService: RedisService,
    @InjectRepository(WaterZoneMetricCalcEntity)
    private readonly zoneMetricRep: Repository<WaterZoneMetricCalcEntity>,
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
  ) {}

  private safeCode(code: string) {
    return String(code || '').replace(/-/g, '_').toLowerCase();
  }

  private rawDeviceChildTable(interval: '5m' | '1h' | '1d', deviceCode: string, pointCode: string) {
    const d = this.safeCode(deviceCode);
    const p = this.safeCode(pointCode);
    return `water_iot.a${interval}_${d}_${p}`;
  }

  private alignToWindow(tsMs: number, interval: '5m' | '1h' | '1d'): number {
    const d = dayjs(tsMs);
    if (interval === '5m') {
      const minutes = d.minute();
      return d.minute(Math.floor(minutes / 5) * 5).second(0).millisecond(0).valueOf();
    } else if (interval === '1h') {
      return d.minute(0).second(0).millisecond(0).valueOf();
    } else if (interval === '1d') {
      return d.hour(0).minute(0).second(0).millisecond(0).valueOf();
    }
    return tsMs;
  }

  /**
   * 重建分区聚合表数据
   */
  async rebuildZoneAggTables(zoneCode: string, metricType: string, dirtyStartMs: number, dirtyEndMs: number) {
    const redis = this.redisService.getClient();
    const metricCacheKey = `${this.zoneMetricCachePrefix}${zoneCode}|${metricType}`;

    let configs: Array<{ pointCode: string; calcSign: number }> | null = null;
    const cached = await redis.get(metricCacheKey);
    if (cached) {
      try {
        configs = JSON.parse(cached);
      } catch {
        configs = null;
      }
    }

    if (!configs) {
      const rows = await this.zoneMetricRep.find({ where: { zoneCode, metricType, delFlag: '0' } });
      configs = rows.map(r => ({ pointCode: r.pointCode, calcSign: r.calcSign }));
      await redis.set(metricCacheKey, JSON.stringify(configs), 'EX', 300);
    }

    if (!configs || configs.length === 0) {
      this.logger.debug(`分区 [${zoneCode}] 的指标 [${metricType}] 无任何测点配置，跳过计算`);
      return;
    }

    const pointCodes = Array.from(new Set(configs.map(c => c.pointCode).filter(Boolean)));
    const pointDeviceMap = new Map<string, string>();
    if (pointCodes.length > 0) {
      const cachedDevices = await redis.hmget(this.pointDeviceHashKey, ...pointCodes);
      const missing: string[] = [];
      for (let i = 0; i < pointCodes.length; i++) {
        const pc = pointCodes[i];
        const dc = cachedDevices[i];
        if (dc) {
          pointDeviceMap.set(pc, dc);
        } else {
          missing.push(pc);
        }
      }

      if (missing.length > 0) {
        const points = await this.pointRep.find({
          where: { code: In(missing), delFlag: '0' },
          select: ['code', 'deviceCode'],
        });
        for (const p of points) {
          pointDeviceMap.set(p.code, p.deviceCode);
          await redis.hset(this.pointDeviceHashKey, p.code, p.deviceCode);
        }
      }
    }

    const intervals: ('5m' | '1h' | '1d')[] = ['5m', '1h', '1d'];

    for (const interval of intervals) {
      const startMs = this.alignToWindow(dirtyStartMs, interval);
      const endMs =
        interval === '5m'
          ? this.alignToWindow(dirtyEndMs, interval) + 5 * 60 * 1000
          : interval === '1h'
            ? this.alignToWindow(dirtyEndMs, interval) + 60 * 60 * 1000
            : this.alignToWindow(dirtyEndMs, interval) + 24 * 60 * 60 * 1000;

      const stable = `water_iot.zone_meters_${interval}`;
      const child = this.tdengineService.zoneChildTable(interval, zoneCode, metricType);

      await this.tdengineService.querySql(
        `CREATE TABLE IF NOT EXISTS ${child} USING ${stable} TAGS ('${zoneCode}', '${metricType}')`,
      );

      await this.tdengineService.querySql(`DELETE FROM ${child} WHERE ts >= ${startMs} AND ts <= ${endMs}`);

      const unionParts: string[] = [];

      for (const config of configs) {
        const deviceCode = pointDeviceMap.get(config.pointCode);

        if (!deviceCode) {
          this.logger.warn(`找不到测点 ${config.pointCode} 的所属设备，跳过参与分区聚合`);
          continue;
        }

        const sourceTable = this.rawDeviceChildTable(interval, deviceCode, config.pointCode);
        const sign = config.calcSign === -1 ? -1 : 1;
        // 注意：由于 unionParts 将会被拼接到 FROM ( ... ) 子查询中，这里需要起别名，否则嵌套查询可能找不到列
        unionParts.push(`SELECT ts, diff_val * ${sign} as val FROM ${sourceTable} WHERE ts >= ${startMs} AND ts <= ${endMs}`);
      }

      if (unionParts.length > 0) {
        const unionSql = unionParts.join(' UNION ALL ');
        // 关键修复点：TDengine 中子查询的结果作为派生表必须给定表别名（比如 t1），否则会报 syntax error 或者不执行
        const finalSql = `
          INSERT INTO ${child}
          SELECT ts, SUM(val) as total_val FROM (
            ${unionSql}
          ) t1 GROUP BY ts
        `;
        
        await this.tdengineService.querySql(finalSql);
      }
    }

    this.logger.log(`分区聚合补算完成: ${zoneCode}-${metricType} ${dirtyStartMs} ~ ${dirtyEndMs}`);
  }
}
