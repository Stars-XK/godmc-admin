import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterPointEntity } from '@app/common';
import { TdengineService } from './tdengine.service';

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
    return new Date(tsMs).toISOString().replace('T', ' ').replace('Z', '');
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
    const start = this.toTdTimeString(startMs);
    const end = this.toTdTimeString(endMs);

    const res = await this.tdengineService.querySql(
      `SELECT FIRST(ts) as firstTs, LAST(ts) as lastTs FROM ${table} WHERE ts >= '${start}' AND ts <= '${end}'`,
    );

    const row = res?.data?.[0] || res?.data?.data?.[0] || null;
    const firstTs = row?.firstTs ? new Date(row.firstTs).getTime() : null;
    const lastTs = row?.lastTs ? new Date(row.lastTs).getTime() : null;

    return { firstTs, lastTs };
  }

  async rebuildAggTables(deviceCode: string, pointCode: string, dirtyStartMs: number, dirtyEndMs: number) {
    const point = await this.pointRep.findOne({ where: { code: pointCode, delFlag: '0' as any } });
    const kind = await this.getPointKind(point);

    const { firstTs, lastTs } = await this.getFirstLastTsMs(deviceCode, pointCode, dirtyStartMs, dirtyEndMs);
    if (!firstTs || !lastTs) return;

    const startMs = Math.max(dirtyStartMs, firstTs);
    const endMs = Math.min(dirtyEndMs, lastTs);
    if (endMs < startMs) return;

    const start = this.toTdTimeString(startMs);
    const end = this.toTdTimeString(endMs);
    const rawTable = this.rawChildTable(deviceCode, pointCode);

    const intervals: AggInterval[] = ['5m', '1h', '1d'];
    for (const interval of intervals) {
      const child = this.aggChildTable(interval, deviceCode, pointCode);
      const stable = this.aggStable(interval);

      await this.tdengineService.querySql(
        `CREATE TABLE IF NOT EXISTS ${child} USING ${stable} TAGS ('${deviceCode}', '${pointCode}')`,
      );

      await this.tdengineService.querySql(`DELETE FROM ${child} WHERE ts >= '${start}' AND ts <= '${end}'`);

      if (kind === 'cumulative') {
        await this.tdengineService.querySql(`
          INSERT INTO ${child}
          SELECT _wstart, LAST(val), LAST(val), LAST(val), 0
          FROM ${rawTable}
          WHERE ts >= '${start}' AND ts <= '${end}'
          INTERVAL(${interval}) FILL(PREV)
        `);
      } else if (kind === 'incremental') {
        await this.tdengineService.querySql(`
          INSERT INTO ${child}
          SELECT _wstart, SUM(val), MAX(val), MIN(val), SUM(val)
          FROM ${rawTable}
          WHERE ts >= '${start}' AND ts <= '${end}'
          INTERVAL(${interval}) FILL(VALUE, 0)
        `);
      } else {
        await this.tdengineService.querySql(`
          INSERT INTO ${child}
          SELECT _wstart, AVG(val), MAX(val), MIN(val), SPREAD(val)
          FROM ${rawTable}
          WHERE ts >= '${start}' AND ts <= '${end}'
          INTERVAL(${interval}) FILL(LINEAR)
        `);
      }
    }

    this.logger.log(`聚合插值补算完成: ${deviceCode}-${pointCode} (${kind}) ${start} ~ ${end}`);
  }
}

