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
    interval: string,
    pointType: 'instantaneous' | 'cumulative',
  ) {
    // 确保子表名合法 (TDengine 表名不支持横线，这里替换为下划线)
    const safeDeviceCode = deviceCode.replace(/-/g, '_').toLowerCase();
    const safePointCode = pointCode.replace(/-/g, '_').toLowerCase();
    // 假设 dbName 为 'water_iot'，和 tdengine.service 保持一致
    const tableName = `water_iot.d_${safeDeviceCode}_${safePointCode}`;

    let selectFields = '';

    // 根据测点分类决定聚合方式
    if (pointType === 'cumulative') {
      // 累计增量（如累计流量）：计算时间窗口内的最大值减去最小值，即用量
      selectFields = 'SPREAD(val) AS val';
    } else {
      // 瞬时数据（如瞬时流量、压力、液位）：计算时间窗口内的平均值、最大值、最小值
      selectFields = 'AVG(val) AS val, MAX(val) AS max_val, MIN(val) AS min_val';
    }

    const sql = `
      SELECT _wstart AS ts, ${selectFields}
      FROM ${tableName}
      WHERE ts >= '${startTime}' AND ts <= '${endTime}'
      INTERVAL(${interval})
      FILL(PREV)
    `;

    try {
      const res = await this.tdengineService.executeSql(sql);
      return res;
    } catch (error) {
      // 捕获表不存在的异常，说明还没有该测点数据
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
    const safeDeviceCode = deviceCode.replace(/-/g, '_').toLowerCase();
    const safePointCode = pointCode.replace(/-/g, '_').toLowerCase();
    const tableName = `water_iot.d_${safeDeviceCode}_${safePointCode}`;

    const sql = `SELECT LAST_ROW(ts, val) FROM ${tableName}`;

    try {
      const res = await this.tdengineService.executeSql(sql);
      return res;
    } catch (error) {
      return { head: [], data: [], rows: 0 };
    }
  }
}
