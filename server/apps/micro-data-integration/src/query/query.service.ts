import { Injectable, Logger } from '@nestjs/common';
import { TdengineService } from '../tdengine/tdengine.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysConfigEntity } from '@app/common/entities/config.entity';
import { WaterPointEntity } from '@app/common/entities/water-basic/water-point.entity';
import { WaterDeviceEntity } from '@app/common/entities/water-basic/water-device.entity';
import dayjs = require('dayjs');

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(
    private readonly tdengineService: TdengineService,
    @InjectRepository(SysConfigEntity)
    private readonly sysConfigRep: Repository<SysConfigEntity>,
    @InjectRepository(WaterPointEntity)
    private readonly waterPointRep: Repository<WaterPointEntity>,
    @InjectRepository(WaterDeviceEntity)
    private readonly waterDeviceRep: Repository<WaterDeviceEntity>,
  ) {}

  /**
   * 按时间窗口查询时序数据的聚合统计值
   * @param deviceCode 设备编码
   * @param pointCode 测点编码
   * @param startTime 开始时间 (e.g. '2024-01-01 00:00:00')
   * @param endTime 结束时间 (e.g. '2024-01-02 00:00:00')
   * @param interval 时间窗口 (e.g. '5m', '1h', '1d')
   * @param pointType 测点类型 ('instantaneous' 瞬时数据, 'cumulative' 累计数据, 'incremental' 增长量数据)
   */
  async getAggregatedData(
    deviceCode: string,
    pointCode: string,
    startTime: string,
    endTime: string,
    interval: '5m' | '1h' | '1d',
    pointType: 'instantaneous' | 'cumulative' | 'incremental',
  ) {
    const safeDeviceCode = deviceCode.replace(/-/g, '_').toLowerCase();
    const safePointCode = pointCode.replace(/-/g, '_').toLowerCase();
    
    // 直接查询对应的流计算聚合超级表
    const tableName = `water_iot.meters_${interval}`;

    // 因为 TdengineAggService 中，对于 cumulative 类型，我们将 LAST(val) 存入了 avg_val，
    // 对于 incremental 类型，我们将 SUM(val) 存入了 avg_val，
    // 对于 instantaneous 类型，存入了 AVG(val)。所以统一取 avg_val 作为代表值。
    let selectFields = 'avg_val AS val, max_val, min_val';

    // 利用 device_code 和 point_code 作为 TAGS 进行快速查询
    const sql = `
      SELECT ts, ${selectFields}
      FROM ${tableName}
      WHERE ts >= '${startTime}' AND ts <= '${endTime}' 
        AND device_code = '${deviceCode}' 
        AND point_code = '${pointCode}'
      ORDER BY ts ASC
    `;

    try {
      const res = await this.tdengineService.querySql(sql);
      return res;
    } catch (error) {
      if (error?.response?.data?.code === 896 || String(error.message).includes('Table does not exist')) {
        this.logger.warn(`查询失败，表 ${tableName} 不存在 (暂无数据)`);
        return { head: [], data: [], rows: 0 };
      }
      throw error;
    }
  }

  /**
   * 获取设备最新实时数据
   */
  async getLatestData(deviceCode: string, pointCode: string) {
    const tableName = `water_iot.meters`;

    // 从原始数据的超级表利用 tag 查找最新数据
    const sql = `
      SELECT LAST_ROW(ts, val)
      FROM ${tableName}
      WHERE device_code = '${deviceCode}'
        AND point_code = '${pointCode}'
    `;
    try {
      const res = await this.tdengineService.querySql(sql);
      return res;
    } catch (error) {
      return null;
    }
  }

  /**
   * 批量获取设备最新实时数据
   */
  async getLatestDataBatch(deviceCode?: string, pointCodes?: string) {
    let sql = `SELECT LAST_ROW(ts, val), device_code, point_code FROM water_iot.meters WHERE 1=1`;
    if (deviceCode) {
      sql += ` AND device_code = '${deviceCode}'`;
    }
    if (pointCodes) {
      const codes = pointCodes.split(',').map(c => `'${c}'`).join(',');
      sql += ` AND point_code IN (${codes})`;
    }
    sql += ` GROUP BY device_code, point_code`;
    
    try {
      const res = await this.tdengineService.querySql(sql);
      const result = [];
      if (res && res.data) {
        res.data.forEach(row => {
          result.push({
            ts: row[0],
            val: row[1],
            deviceCode: row[2],
            pointCode: row[3]
          });
        });
      }
      return result;
    } catch (error) {
      return [];
    }
  }

  async getHistoryData(deviceCode: string, pointCode: string, startTime: string, endTime: string, interval: string = 'raw') {
    let tableName = `water_iot.meters`;
    let valColumn = 'val';

    if (interval === '5m') {
      tableName = `water_iot.meters_5m`;
      valColumn = 'avg_val';
    } else if (interval === '1h') {
      tableName = `water_iot.meters_1h`;
      valColumn = 'avg_val';
    } else if (interval === '1d') {
      tableName = `water_iot.meters_1d`;
      valColumn = 'avg_val';
    }

    let sql = `SELECT ts, ${valColumn} as val FROM ${tableName} WHERE ts >= '${startTime}' AND ts <= '${endTime}'`;
    sql += ` AND device_code = '${deviceCode}' AND point_code = '${pointCode}'`;
    sql += ` ORDER BY ts ASC LIMIT 10000`;

    try {
      const res = await this.tdengineService.querySql(sql);
      const result = [];
      if (res && res.data) {
        res.data.forEach(row => {
          result.push({ ts: row[0], val: row[1] });
        });
      }
      return result;
    } catch (error) {
      return [];
    }
  }

  /**
   * 批量获取分区夜间最小流量 (今日/昨日/插值/比率)
   * 动态计算，不查历史固化表，以解决配置变动和数据延迟问题
   */
  async getZoneNightFlowBatch(zoneCodes: string[]) {
    if (!zoneCodes || zoneCodes.length === 0) return [];

    // 1. 获取系统配置中的夜间流量起止时间，默认 02:00 - 04:00
    let startStr = '02:00';
    let endStr = '04:00';
    
    try {
      const configStart = await this.sysConfigRep.findOne({ where: { configKey: 'zone.night.flow.start' } });
      const configEnd = await this.sysConfigRep.findOne({ where: { configKey: 'zone.night.flow.end' } });
      if (configStart?.configValue) startStr = configStart.configValue;
      if (configEnd?.configValue) endStr = configEnd.configValue;
    } catch (e) {
      this.logger.warn('获取系统配置 zone.night.flow.start/end 失败，使用默认值 02:00-04:00');
    }

    const todayStr = dayjs().format('YYYY-MM-DD');
    const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    const todayStart = `${todayStr} ${startStr}:00`;
    const todayEnd = `${todayStr} ${endStr}:00`;
    const yesterdayStart = `${yesterdayStr} ${startStr}:00`;
    const yesterdayEnd = `${yesterdayStr} ${endStr}:00`;

    const codesStr = zoneCodes.map(c => `'${c}'`).join(',');
    
    // 查询今日夜间最小流量
    const sqlToday = `
      SELECT zone_code, MIN(total_val) as min_flow
      FROM water_iot.zone_meters_5m 
      WHERE metric_type = 'min_flow' 
        AND ts >= '${todayStart}' 
        AND ts <= '${todayEnd}'
        AND zone_code IN (${codesStr}) 
      GROUP BY zone_code
    `;

    // 查询昨日夜间最小流量
    const sqlYesterday = `
      SELECT zone_code, MIN(total_val) as min_flow
      FROM water_iot.zone_meters_5m 
      WHERE metric_type = 'min_flow' 
        AND ts >= '${yesterdayStart}' 
        AND ts <= '${yesterdayEnd}'
        AND zone_code IN (${codesStr}) 
      GROUP BY zone_code
    `;

    const resultMap = new Map<string, any>();
    zoneCodes.forEach(code => {
      resultMap.set(code, {
        zoneCode: code,
        todayVal: null,
        yesterdayVal: null,
        diffVal: null,
        ratio: null
      });
    });

    try {
      const [resToday, resYesterday] = await Promise.all([
        this.tdengineService.querySql(sqlToday).catch(() => ({ data: [] })),
        this.tdengineService.querySql(sqlYesterday).catch(() => ({ data: [] }))
      ]);

      if (resToday && resToday.data) {
        resToday.data.forEach(row => {
          const zCode = row[0];
          const minFlow = row[1];
          if (resultMap.has(zCode)) {
            resultMap.get(zCode).todayVal = minFlow;
          }
        });
      }

      if (resYesterday && resYesterday.data) {
        resYesterday.data.forEach(row => {
          const zCode = row[0];
          const minFlow = row[1];
          if (resultMap.has(zCode)) {
            resultMap.get(zCode).yesterdayVal = minFlow;
          }
        });
      }

      // 计算插值和比率
      const finalResult = [];
      for (const [code, item] of resultMap.entries()) {
        const tVal = item.todayVal;
        const yVal = item.yesterdayVal;
        
        if (tVal !== null && yVal !== null) {
          item.diffVal = Number((tVal - yVal).toFixed(3));
          if (yVal !== 0) {
            item.ratio = Number(((item.diffVal / yVal) * 100).toFixed(1));
          }
        }
        
        // 格式化展示
        if (item.todayVal !== null) item.todayVal = Number(item.todayVal.toFixed(3));
        if (item.yesterdayVal !== null) item.yesterdayVal = Number(item.yesterdayVal.toFixed(3));
        
        finalResult.push(item);
      }

      return finalResult;
    } catch (e) {
      this.logger.error('批量获取分区夜间最小流量失败', e);
      return [];
    }
  }

  /**
   * 获取分区下所有测点的最新实时数据
   */
  async getZonePointsLatestData(zoneCode: string) {
    if (!zoneCode) return [];

    // 1. 获取该分区下的所有设备
    const devices = await this.waterDeviceRep.find({
      where: { zoneCode, delFlag: '0' },
      select: ['code', 'name']
    });

    if (devices.length === 0) return [];
    const deviceCodes = devices.map(d => d.code);

    // 2. 获取这些设备的所有测点
    const points = await this.waterPointRep.createQueryBuilder('point')
      .where('point.device_code IN (:...deviceCodes)', { deviceCodes })
      .andWhere("point.del_flag = '0'")
      .select(['point.code', 'point.name', 'point.deviceCode'])
      .getMany();

    if (points.length === 0) return [];
    
    // 构建字典加速查找
    const pointDict = new Map<string, any>();
    points.forEach(p => {
      pointDict.set(`${p.deviceCode}_${p.code}`, {
        pointName: p.name,
        deviceCode: p.deviceCode,
        pointCode: p.code,
        val: null,
        ts: null
      });
    });

    // 3. 从 TDengine 查询这些设备测点的最新值
    const codesStr = deviceCodes.map(c => `'${c}'`).join(',');
    const sql = `
      SELECT LAST_ROW(ts, val), device_code, point_code 
      FROM water_iot.meters 
      WHERE device_code IN (${codesStr})
      GROUP BY device_code, point_code
    `;

    try {
      const res = await this.tdengineService.querySql(sql);
      if (res && res.data) {
        res.data.forEach(row => {
          const ts = row[0];
          const val = row[1];
          const dCode = row[2];
          const pCode = row[3];
          
          const key = `${dCode}_${pCode}`;
          if (pointDict.has(key)) {
            const item = pointDict.get(key);
            item.val = val !== null ? Number(Number(val).toFixed(3)) : '--';
            item.ts = ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : '--';
          }
        });
      }
    } catch (error) {
      this.logger.error(`获取分区测点最新数据失败: ${zoneCode}`, error);
    }

    // 过滤出有数据的测点，或者全部返回
    const result = Array.from(pointDict.values()).filter(p => p.val !== null);
    // 按时间倒序或设备排序
    return result;
  }
}
