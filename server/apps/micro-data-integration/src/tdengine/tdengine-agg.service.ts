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
    const firstTs = row?.firstTs ? new Date(row.firstTs).getTime() : null;
    const lastTs = row?.lastTs ? new Date(row.lastTs).getTime() : null;

    return { firstTs, lastTs };
  }

  async rebuildAggTables(deviceCode: string, pointCode: string, dirtyStartMs: number, dirtyEndMs: number) {
    // 1. 获取该范围内的真实数据边界
    const { firstTs, lastTs } = await this.getFirstLastTsMs(deviceCode, pointCode, dirtyStartMs, dirtyEndMs);
    if (!firstTs || !lastTs) {
      return;
    }

    // 2. 根据首尾时间对齐窗口（向下对齐到5分钟/1小时/1天的起点）
    const startMs = this.alignToWindow(firstTs, '5m');
    const endMs = this.alignToWindow(lastTs, '5m') + 5 * 60 * 1000; // 包含当前窗口结束

    const point = await this.pointRep.findOne({ where: { code: pointCode, deviceCode } });
    const kind = await this.getPointKind(point);

    const rawTable = this.rawChildTable(deviceCode, pointCode);

    const intervals: AggInterval[] = ['5m', '1h', '1d'];
    for (const interval of intervals) {
      const child = this.aggChildTable(interval, deviceCode, pointCode);
      const stable = this.aggStable(interval);

      await this.tdengineService.querySql(
        `CREATE TABLE IF NOT EXISTS ${child} USING ${stable} TAGS ('${deviceCode}', '${pointCode}')`,
      );

      await this.tdengineService.querySql(`DELETE FROM ${child} WHERE ts >= ${startMs} AND ts <= ${endMs}`);

      if (kind === 'cumulative') {
        await this.tdengineService.querySql(`
          INSERT INTO ${child}
          SELECT _wstart, LAST(val), LAST(val), LAST(val), 0
          FROM ${rawTable}
          WHERE ts >= ${startMs} AND ts <= ${endMs}
          INTERVAL(${interval}) FILL(PREV)
        `);
      } else if (kind === 'incremental') {
        await this.tdengineService.querySql(`
          INSERT INTO ${child}
          SELECT _wstart, SUM(val), MAX(val), MIN(val), SUM(val)
          FROM ${rawTable}
          WHERE ts >= ${startMs} AND ts <= ${endMs}
          INTERVAL(${interval}) FILL(VALUE, 0)
        `);
      } else {
        await this.tdengineService.querySql(`
          INSERT INTO ${child}
          SELECT _wstart, AVG(val), MAX(val), MIN(val), SPREAD(val)
          FROM ${rawTable}
          WHERE ts >= ${startMs} AND ts <= ${endMs}
          INTERVAL(${interval}) FILL(LINEAR)
        `);
      }
    }

    this.logger.log(`聚合插值补算完成: ${deviceCode}-${pointCode} (${kind}) ${startMs} ~ ${endMs}`);
  }
}

