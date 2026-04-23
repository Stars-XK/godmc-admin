import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterZoneMetricCalcEntity } from '@app/common';
import { TdengineService } from './tdengine.service';
import dayjs from 'dayjs';

@Injectable()
export class TdengineZoneAggService {
  private readonly logger = new Logger(TdengineZoneAggService.name);

  constructor(
    private readonly tdengineService: TdengineService,
    @InjectRepository(WaterZoneMetricCalcEntity)
    private readonly zoneMetricRep: Repository<WaterZoneMetricCalcEntity>,
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
    // 1. 获取该分区指标的所有计算测点
    const configs = await this.zoneMetricRep.find({
      where: { zoneCode, metricType, delFlag: '0' },
    });

    if (!configs || configs.length === 0) {
      this.logger.debug(`分区 [${zoneCode}] 的指标 [${metricType}] 无任何测点配置，跳过计算`);
      return;
    }

    // 2. 根据首尾时间对齐窗口（向下对齐到5分钟/1小时/1天的起点）
    const startMs = this.alignToWindow(dirtyStartMs, '5m');
    const endMs = this.alignToWindow(dirtyEndMs, '5m') + 5 * 60 * 1000; // 包含当前窗口结束

    const intervals: ('5m' | '1h' | '1d')[] = ['5m', '1h', '1d'];

    for (const interval of intervals) {
      const stable = `water_iot.zone_meters_${interval}`;
      const child = this.tdengineService.zoneChildTable(interval, zoneCode, metricType);

      // 创建分区聚合子表
      await this.tdengineService.querySql(
        `CREATE TABLE IF NOT EXISTS ${child} USING ${stable} TAGS ('${zoneCode}', '${metricType}')`,
      );

      // 清除目标时间段内旧数据
      await this.tdengineService.querySql(`DELETE FROM ${child} WHERE ts >= ${startMs} AND ts <= ${endMs}`);

      // 动态拼接 UNION ALL SQL 语句进行库内聚合
      const unionParts: string[] = [];

      for (const config of configs) {
        // 由于配置表中可能只存了 pointCode，我们需要找到其对应的 deviceCode。
        // 在全局导入时，设备编码已经保存在 config 中，或者我们可以通过关系查。
        // 注意：目前 WaterZoneMetricCalcEntity 中没有 deviceCode，如果之前没有添加，
        // 则需要根据 pointCode 查询设备。这里假设可以通过 point_code 在 MySQL 中找到关联。
        // 为了简化，假设全局导入时我们知道，或者我们可以从测点表反查。
        // 我们直接从 point_code 找到所属的 deviceCode
        const point = await this.tdengineService.querySql(`SELECT FIRST(device_code) as dc FROM water_iot.meters WHERE point_code='${config.pointCode}'`);
        
        let deviceCode = null;
        const row = point?.data?.[0] || point?.data?.data?.[0] || null;
        if (Array.isArray(row)) {
           deviceCode = row[0];
        } else if (row && typeof row === 'object') {
           deviceCode = row.dc;
        }

        if (!deviceCode) {
           this.logger.warn(`找不到测点 ${config.pointCode} 的所属设备，跳过参与分区聚合`);
           continue;
        }

        const sourceTable = this.rawDeviceChildTable(interval, deviceCode, config.pointCode);
        const sign = config.calcSign === -1 ? -1 : 1; // 1 为进水(加)，-1 为出水(减)
        
        // 我们利用在设备聚合时就算好的 diff_val
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

    this.logger.log(`分区聚合补算完成: ${zoneCode}-${metricType} ${startMs} ~ ${endMs}`);
  }
}