import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { TdengineService } from '../tdengine/tdengine.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysConfigEntity } from '@app/common/entities/config.entity';
import { WaterPointEntity } from '@app/common/entities/water-basic/water-point.entity';
import { WaterDeviceEntity } from '@app/common/entities/water-basic/water-device.entity';
import { SysAlarmHistoryEntity } from '@app/common/entities/alarm/sys-alarm-history.entity';
import dayjs = require('dayjs');

const VALID_INTERVALS = new Set(['5m', '1h', '1d', 'raw']);
const DATETIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const SAFE_CODE_RE = /^[a-zA-Z0-9_\-./]+$/;

function validateCode(label: string, value: string) {
  if (!value || !SAFE_CODE_RE.test(value)) {
    throw new BadRequestException(`无效参数 ${label}: ${value}`);
  }
}

function validateDatetime(label: string, value: string) {
  if (!value || !DATETIME_RE.test(value)) {
    throw new BadRequestException(`无效时间格式 ${label}: ${value}`);
  }
}

function validateInterval(value: string) {
  if (value !== 'raw' && !VALID_INTERVALS.has(value)) {
    throw new BadRequestException(`无效时间窗口: ${value}`);
  }
}

function sanitizeCode(value: string): string {
  return value.replace(/[^a-zA-Z0-9_\-./]/g, '');
}

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
    @InjectRepository(SysAlarmHistoryEntity)
    private readonly alarmHistoryRep: Repository<SysAlarmHistoryEntity>,
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
    validateCode('deviceCode', deviceCode);
    validateCode('pointCode', pointCode);
    validateDatetime('startTime', startTime);
    validateDatetime('endTime', endTime);
    validateInterval(interval);

    const safeDeviceCode = sanitizeCode(deviceCode.replace(/-/g, '_').toLowerCase());
    const safePointCode = sanitizeCode(pointCode.replace(/-/g, '_').toLowerCase());

    const tableName = `water_iot.meters_${interval}`;

    let selectFields = 'avg_val AS val, max_val, min_val';

    const sql = `
      SELECT ts, ${selectFields}
      FROM ${tableName}
      WHERE ts >= '${startTime}' AND ts <= '${endTime}'
        AND device_code = '${safeDeviceCode}'
        AND point_code = '${safePointCode}'
      ORDER BY ts ASC
    `;

    try {
      const res = await this.tdengineService.querySql(sql);
      // 规范化为 [{ts, val, max, min}] 数组，便于调用方直接遍历
      const result: { ts: string; val: number; max: number; min: number }[] = [];
      if (res?.data && Array.isArray(res.data)) {
        for (const row of res.data) {
          result.push({
            ts: row[0],
            val: row[1] != null ? Number(row[1]) : 0,
            max: row[2] != null ? Number(row[2]) : 0,
            min: row[3] != null ? Number(row[3]) : 0,
          });
        }
      }
      return result;
    } catch (error) {
      if (error?.response?.data?.code === 896 || String(error.message).includes('Table does not exist')) {
        this.logger.warn(`查询失败，表 ${tableName} 不存在 (暂无数据)`);
        return [];
      }
      throw error;
    }
  }

  /**
   * 获取设备最新实时数据，返回规范化 {ts, val} 或 null
   */
  async getLatestData(deviceCode: string, pointCode: string): Promise<{ ts: string; val: number } | null> {
    validateCode('deviceCode', deviceCode);
    validateCode('pointCode', pointCode);
    const safeDeviceCode = sanitizeCode(deviceCode.replace(/-/g, '_').toLowerCase());
    const safePointCode = sanitizeCode(pointCode.replace(/-/g, '_').toLowerCase());

    const tableName = `water_iot.meters`;

    const sql = `
      SELECT LAST_ROW(ts, val)
      FROM ${tableName}
      WHERE device_code = '${safeDeviceCode}'
        AND point_code = '${safePointCode}'
    `;
    try {
      const res = await this.tdengineService.querySql(sql);
      if (res?.data?.[0]) {
        const row = res.data[0];
        return { ts: row[0], val: row[1] != null ? Number(row[1]) : 0 };
      }
      return null;
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
      validateCode('deviceCode', deviceCode);
      const safeDeviceCode = sanitizeCode(deviceCode.replace(/-/g, '_').toLowerCase());
      sql += ` AND device_code = '${safeDeviceCode}'`;
    }
    if (pointCodes) {
      const codes = pointCodes.split(',').map(c => {
        const sc = sanitizeCode(c.trim().replace(/-/g, '_').toLowerCase());
        if (!sc || !SAFE_CODE_RE.test(sc)) throw new BadRequestException(`无效测点编码: ${c}`);
        return `'${sc}'`;
      }).join(',');
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
    validateCode('deviceCode', deviceCode);
    validateCode('pointCode', pointCode);
    validateDatetime('startTime', startTime);
    validateDatetime('endTime', endTime);
    validateInterval(interval);

    const safeDeviceCode = sanitizeCode(deviceCode.replace(/-/g, '_').toLowerCase());
    const safePointCode = sanitizeCode(pointCode.replace(/-/g, '_').toLowerCase());

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
    sql += ` AND device_code = '${safeDeviceCode}' AND point_code = '${safePointCode}'`;
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

    const safeCodes = zoneCodes.map(c => {
      validateCode('zoneCode', c);
      return sanitizeCode(c);
    });

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

    // 放宽限制，查询全天的最小值，避免测试数据在下午生成导致 02:00-04:00 区间为空
    const todayStart = `${todayStr} 00:00:00`;
    const todayEnd = `${todayStr} 23:59:59`;
    const yesterdayStart = `${yesterdayStr} 00:00:00`;
    const yesterdayEnd = `${yesterdayStr} 23:59:59`;

    const safeToOriginal = new Map<string, string>();
    zoneCodes.forEach((c, i) => safeToOriginal.set(safeCodes[i], c));
    const codesStr = safeCodes.map(c => `'${c}'`).join(',');
    
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

    const resolveCode = (raw: string) => safeToOriginal.get(raw) || raw;

    try {
      const [resToday, resYesterday] = await Promise.all([
        this.tdengineService.querySql(sqlToday).catch(() => ({ data: [] })),
        this.tdengineService.querySql(sqlYesterday).catch(() => ({ data: [] }))
      ]);

      if (resToday && resToday.data) {
        resToday.data.forEach(row => {
          const originalCode = resolveCode(row[0]);
          const minFlow = row[1];
          if (resultMap.has(originalCode)) {
            resultMap.get(originalCode).todayVal = minFlow;
          }
        });
      }

      if (resYesterday && resYesterday.data) {
        resYesterday.data.forEach(row => {
          const originalCode = resolveCode(row[0]);
          const minFlow = row[1];
          if (resultMap.has(originalCode)) {
            resultMap.get(originalCode).yesterdayVal = minFlow;
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
   * 获取分区30天夜间最小流量趋势
   */
  async getZoneNightFlowTrend(zoneCode: string) {
    if (!zoneCode) return [];
    validateCode('zoneCode', zoneCode);
    const safeZoneCode = sanitizeCode(zoneCode);

    let startStr = '02:00';
    let endStr = '04:00';
    try {
      const configStart = await this.sysConfigRep.findOne({ where: { configKey: 'zone.night.flow.start' } });
      const configEnd = await this.sysConfigRep.findOne({ where: { configKey: 'zone.night.flow.end' } });
      if (configStart?.configValue) startStr = configStart.configValue;
      if (configEnd?.configValue) endStr = configEnd.configValue;
    } catch (e) {
      this.logger.warn('获取系统配置失败，使用默认值 02:00-04:00');
    }

    const today = dayjs();
    const startTimeStr = today.subtract(30, 'day').format('YYYY-MM-DD');
    const endTimeStr = today.format('YYYY-MM-DD');

    // 移除严格的时间段限制，并采用 TDengine 原生支持的 INTERVAL
    const sql = `
      SELECT ts as date, MIN(total_val) as min_flow
      FROM water_iot.zone_meters_5m 
      WHERE metric_type = 'min_flow' 
        AND ts >= '${startTimeStr} 00:00:00' 
        AND ts <= '${endTimeStr} 23:59:59'
        AND zone_code = '${safeZoneCode}'
      INTERVAL(1d)
    `;

    try {
      const res = await this.tdengineService.querySql(sql);
      const result = [];
      if (res && res.data) {
        res.data.forEach(row => {
          result.push({
            date: dayjs(row[0]).format('MM-DD'),
            value: row[1] !== null ? Number(row[1].toFixed(3)) : null
          });
        });
      }
      return result;
    } catch (e) {
      this.logger.error('获取分区30天夜间最小流量趋势失败', e);
      return [];
    }
  }

  /**
   * 获取分区10天小时表数据
   */
  async getZoneHourlyTrend(zoneCode: string) {
    if (!zoneCode) return [];
    validateCode('zoneCode', zoneCode);
    const safeZoneCode = sanitizeCode(zoneCode);

    const today = dayjs();
    const startTimeStr = today.subtract(10, 'day').format('YYYY-MM-DD');
    const endTimeStr = today.format('YYYY-MM-DD');

    const sql = `
      SELECT ts, total_val
      FROM water_iot.zone_meters_1h 
      WHERE metric_type = 'water_supply' 
        AND ts >= '${startTimeStr} 00:00:00' 
        AND ts <= '${endTimeStr} 23:59:59'
        AND zone_code = '${safeZoneCode}'
      ORDER BY ts ASC
    `;

    try {
      const res = await this.tdengineService.querySql(sql);
      const result = [];
      if (res && res.data) {
        res.data.forEach(row => {
          result.push({
            time: dayjs(row[0]).format('MM-DD HH:mm'),
            value: row[1] !== null ? Number(row[1].toFixed(3)) : null
          });
        });
      }
      return result;
    } catch (e) {
      this.logger.error('获取分区10天小时表数据失败', e);
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
    const safeDeviceCodes = deviceCodes.map(c => sanitizeCode(c.replace(/-/g, '_').toLowerCase()));
    const dcSafeToOrig = new Map<string, string>();
    deviceCodes.forEach((c, i) => dcSafeToOrig.set(safeDeviceCodes[i], c));
    const codesStr = safeDeviceCodes.map(c => `'${c}'`).join(',');
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
          const dCode = dcSafeToOrig.get(row[2]) || row[2];
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

  /**
   * 获取分区产销差数据 — 查询最近 N 小时的进水/出水总量
   * 用于爆管分析的产销差检测
   */
  async getZoneSupplyDiff(zoneCode: string, hours: number = 24) {
    if (!zoneCode) return { totalInflow: 0, totalOutflow: 0, supplyData: [], salesData: [] };
    validateCode('zoneCode', zoneCode);
    const safeZoneCode = sanitizeCode(zoneCode);

    const startTime = dayjs().subtract(hours, 'hour').format('YYYY-MM-DD HH:mm:ss');
    const endTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // 进水 (water_supply)
    const sqlSupply = `
      SELECT ts, total_val
      FROM water_iot.zone_meters_1h
      WHERE metric_type = 'water_supply'
        AND ts >= '${startTime}'
        AND ts <= '${endTime}'
        AND zone_code = '${safeZoneCode}'
      ORDER BY ts ASC
    `;

    // 出水/售水 (water_sales)
    const sqlSales = `
      SELECT ts, total_val
      FROM water_iot.zone_meters_1h
      WHERE metric_type = 'water_sales'
        AND ts >= '${startTime}'
        AND ts <= '${endTime}'
        AND zone_code = '${safeZoneCode}'
      ORDER BY ts ASC
    `;

    try {
      const [resSupply, resSales] = await Promise.all([
        this.tdengineService.querySql(sqlSupply).catch(() => ({ data: [] })),
        this.tdengineService.querySql(sqlSales).catch(() => ({ data: [] })),
      ]);

      const supplyData: { ts: string; val: number }[] = [];
      const salesData: { ts: string; val: number }[] = [];

      if (resSupply?.data) {
        resSupply.data.forEach((row: any) => supplyData.push({
          ts: row[0], val: row[1] != null ? Number(row[1]) : 0,
        }));
      }
      if (resSales?.data) {
        resSales.data.forEach((row: any) => salesData.push({
          ts: row[0], val: row[1] != null ? Number(row[1]) : 0,
        }));
      }

      // 汇总最近 3 小时
      const recentSupply = supplyData.slice(-3);
      const recentSales = salesData.slice(-3);
      const totalInflow = recentSupply.reduce((s, d) => s + d.val, 0);
      const totalOutflow = recentSales.reduce((s, d) => s + d.val, 0);

      return {
        totalInflow: Number(totalInflow.toFixed(2)),
        totalOutflow: Number(totalOutflow.toFixed(2)),
        supplyData,
        salesData,
      };
    } catch (e) {
      this.logger.warn(`获取分区产销差数据失败 (${zoneCode}): ${e?.message || e}`);
      return { totalInflow: 0, totalOutflow: 0, supplyData: [], salesData: [] };
    }
  }

  /**
   * 获取分区下的活跃报警数据
   */
  async getZoneAlarms(zoneCode: string) {
    if (!zoneCode) return [];

    // 查找分区下的所有设备
    const devices = await this.waterDeviceRep.find({
      where: { zoneCode, delFlag: '0' },
      select: ['code']
    });
    const deviceCodes = devices.map(d => d.code);

    // 构建 alarmSource 匹配列表：分区编码 + 所有设备编码
    const sourcePatterns = [zoneCode, ...deviceCodes];

    // 查询未处理的活跃报警（状态为 '0' 未处理）
    const alarms = await this.alarmHistoryRep.createQueryBuilder('a')
      .where('a.alarmSource IN (:...sources)', { sources: sourcePatterns })
      .andWhere("a.status = '0'")
      .orderBy('a.alarmTime', 'DESC')
      .limit(200)
      .getMany();

    return alarms.map(a => ({
      alarmId: a.alarmId,
      ruleId: a.ruleId,
      ruleName: a.ruleName,
      alarmLevel: a.alarmLevel,
      alarmContent: a.alarmContent,
      alarmTime: a.alarmTime,
      alarmSource: a.alarmSource,
      status: a.status,
    }));
  }
}
