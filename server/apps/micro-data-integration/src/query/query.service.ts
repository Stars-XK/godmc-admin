import { Injectable, Logger } from '@nestjs/common';
import { TdengineService } from '../tdengine/tdengine.service';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(private readonly tdengineService: TdengineService) {}

  /**
   * 按时间窗口查询时序数据的聚合统计值
   * @param deviceCode 设备编码
   * @param pointCode 测点编码
   * @param startTime 开始时间 (e.g. '2024-01-01 00:00:00')
   * @param endTime 结束时间 (e.g. '2024-01-02 00:00:00')
   * @param interval 时间窗口 (e.g. '5m', '1h', '1d')
   * @param pointType 测点类型 ('instantaneous' 瞬时数据, 'cumulative' 累计数据)
   */
  async getAggregatedData(
    deviceCode: string,
    pointCode: string,
    startTime: string,
    endTime: string,
    interval: '5m' | '1h' | '1d',
    pointType: 'instantaneous' | 'cumulative',
  ) {
    const safeDeviceCode = deviceCode.replace(/-/g, '_').toLowerCase();
    const safePointCode = pointCode.replace(/-/g, '_').toLowerCase();
    
    // 直接查询对应的流计算聚合超级表
    const tableName = `water_iot.meters_${interval}`;

    let selectFields = '';

    // 根据测点分类决定聚合方式
    if (pointType === 'cumulative') {
      // 累计增量（如累计流量）：流计算已经计算了 spread_val
      selectFields = 'spread_val AS val';
    } else {
      // 瞬时数据（如瞬时流量、压力、液位）：查询流计算预聚合的 avg, max, min
      selectFields = 'avg_val AS val, max_val, min_val';
    }

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
      return { head: [], data: [], rows: 0 };
    }
  }
}
