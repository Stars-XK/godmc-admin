import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterPointEntity } from '@app/common';
import { TdengineService } from './tdengine.service';
import dayjs from 'dayjs';

export type AggInterval = '5m' | '1h' | '1d';
export type PointKind = 'instantaneous' | 'cumulative' | 'incremental';

@Injectable()
export class TdengineAggService {
  private readonly logger = new Logger(TdengineAggService.name);

  constructor(
    private readonly tdengineService: TdengineService,
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
  ) {}

  async getPointKind(point: WaterPointEntity | null | undefined): Promise<PointKind> {
    if (!point || !point.aggType) return 'instantaneous';
    return point.aggType as PointKind;
  }

  private safeCode(code: string) {
    return String(code || '').replace(/-/g, '_').toLowerCase();
  }

  private toTdTimeString(tsMs: number) {
    return dayjs(tsMs).format('YYYY-MM-DD HH:mm:ss.SSS');
  }

  private alignToWindow(tsMs: number, interval: AggInterval): number {
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

  private aggChildTable(interval: AggInterval, deviceCode: string, pointCode: string) {
    const d = this.safeCode(deviceCode);
    const p = this.safeCode(pointCode);
    if (interval === '5m') return `water_iot.a5m_${d}_${p}`;
    if (interval === '1h') return `water_iot.a1h_${d}_${p}`;
    return `water_iot.a1d_${d}_${p}`;
  }

  private aggStable(interval: AggInterval) {
    if (interval === '5m') return 'water_iot.meters_5m';
    if (interval === '1h') return 'water_iot.meters_1h';
    return 'water_iot.meters_1d';
  }

  private rawChildTable(deviceCode: string, pointCode: string) {
    const d = this.safeCode(deviceCode);
    const p = this.safeCode(pointCode);
    return `water_iot.d_${d}_${p}`;
  }

  async getFirstLastTsMs(deviceCode: string, pointCode: string, startMs: number, endMs: number) {
    const table = this.rawChildTable(deviceCode, pointCode);

    const res = await this.tdengineService.querySql(
      `SELECT FIRST(ts) as firstTs, LAST(ts) as lastTs FROM ${table} WHERE ts >= ${startMs} AND ts <= ${endMs}`,
    );

    const row = res?.data?.[0] || res?.data?.data?.[0] || null;
    let firstTs = null;
    let lastTs = null;

    if (Array.isArray(row)) {
      // TDengine REST API 返回的是二维数组，例如：data: [["2026-03-24 13:30:00.000", "2026-04-23 13:30:00.000"]]
      firstTs = row[0] ? new Date(row[0]).getTime() : null;
      lastTs = row[1] ? new Date(row[1]).getTime() : null;
    } else if (row && typeof row === 'object') {
      // 兼容某些驱动或转换件将其转为对象的情况
      firstTs = row.firstTs ? new Date(row.firstTs).getTime() : null;
      lastTs = row.lastTs ? new Date(row.lastTs).getTime() : null;
    }

    return { firstTs, lastTs };
  }

  async rebuildAggTables(deviceCode: string, pointCode: string, dirtyStartMs: number, dirtyEndMs: number) {
    // 1. 获取该范围内的真实数据边界
    const { firstTs, lastTs } = await this.getFirstLastTsMs(deviceCode, pointCode, dirtyStartMs, dirtyEndMs);
    if (!firstTs || !lastTs) {
      return;
    }

    const point = await this.pointRep.findOne({ where: { code: pointCode, deviceCode } });
    const kind = await this.getPointKind(point);

    const rawTable = this.rawChildTable(deviceCode, pointCode);

    const intervals: AggInterval[] = ['5m', '1h', '1d'];
    for (const interval of intervals) {
      const startMs = this.alignToWindow(firstTs, interval);
      const endMs =
        interval === '5m'
          ? this.alignToWindow(lastTs, interval) + 5 * 60 * 1000
          : interval === '1h'
            ? this.alignToWindow(lastTs, interval) + 60 * 60 * 1000
            : this.alignToWindow(lastTs, interval) + 24 * 60 * 60 * 1000;

      const child = this.aggChildTable(interval, deviceCode, pointCode);
      const stable = this.aggStable(interval);

      await this.tdengineService.querySql(
        `CREATE TABLE IF NOT EXISTS ${child} USING ${stable} TAGS ('${deviceCode}', '${pointCode}')`,
      );

      await this.tdengineService.querySql(`DELETE FROM ${child} WHERE ts >= ${startMs} AND ts <= ${endMs}`);

      if (kind === 'cumulative') {
        await this.tdengineService.querySql(`
          INSERT INTO ${child}
          SELECT ts, last_val, last_val, last_val, 0, IFNULL(DIFF(last_val), 0)
          FROM (
            SELECT _wstart as ts, LAST(val) as last_val
            FROM ${rawTable}
            WHERE ts >= ${startMs} AND ts <= ${endMs}
            INTERVAL(${interval}) FILL(PREV)
          )
        `);
      } else if (kind === 'incremental') {
        await this.tdengineService.querySql(`
          INSERT INTO ${child}
          SELECT _wstart, SUM(val), MAX(val), MIN(val), SUM(val), SUM(val)
          FROM ${rawTable}
          WHERE ts >= ${startMs} AND ts <= ${endMs}
          INTERVAL(${interval}) FILL(VALUE, 0)
        `);
      } else {
        // 判断是否为瞬时流量
        const isInstant = point?.type && (point.type.includes('INSTANT') || point.type.includes('INLET') || point.type.includes('OUTLET'));
        const diffCalc = isInstant ? 'INTEGRAL(val)/3600000' : '0';

        await this.tdengineService.querySql(`
          INSERT INTO ${child}
          SELECT _wstart, AVG(val), MAX(val), MIN(val), SPREAD(val), ${diffCalc}
          FROM ${rawTable}
          WHERE ts >= ${startMs} AND ts <= ${endMs}
          INTERVAL(${interval}) FILL(LINEAR)
        `);
      }
    }

    this.logger.log(`聚合插值补算完成: ${deviceCode}-${pointCode} (${kind}) ${dirtyStartMs} ~ ${dirtyEndMs}`);
  }
}
