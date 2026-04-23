import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WaterPointEntity, WaterZoneMetricCalcEntity } from '@app/common';
import { TdengineService } from './tdengine.service';
import dayjs from 'dayjs';

@Injectable()
export class TdengineZoneAggService {
  private readonly logger = new Logger(TdengineZoneAggService.name);

  constructor(
    private readonly tdengineService: TdengineService,
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
    const configs = await this.zoneMetricRep.find({
      where: { zoneCode, metricType, delFlag: '0' },
    });

    if (!configs || configs.length === 0) {
      this.logger.debug(`分区 [${zoneCode}] 的指标 [${metricType}] 无任何测点配置，跳过计算`);
      return;
    }

    const pointCodes = Array.from(new Set(configs.map(c => c.pointCode).filter(Boolean)));
    const points = pointCodes.length > 0
      ? await this.pointRep.find({
        where: { code: In(pointCodes), delFlag: '0' },
        select: ['code', 'deviceCode'],
      })
      : [];
    const pointDeviceMap = new Map(points.map(p => [p.code, p.deviceCode]));

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
        unionParts.push(`SELECT ts, diff_val * ${sign} as val FROM ${sourceTable} WHERE ts >= ${startMs} AND ts <= ${endMs}`);
      }

      if (unionParts.length > 0) {
        const unionSql = unionParts.join(' UNION ALL ');
        const finalSql = `
          INSERT INTO ${child}
          SELECT ts, SUM(val) as val FROM (
            ${unionSql}
          ) GROUP BY ts
        `;
        
        await this.tdengineService.querySql(finalSql);
      }
    }

    this.logger.log(`分区聚合补算完成: ${zoneCode}-${metricType} ${dirtyStartMs} ~ ${dirtyEndMs}`);
  }
}
