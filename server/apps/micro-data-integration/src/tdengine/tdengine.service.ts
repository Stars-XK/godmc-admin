import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TdengineService implements OnModuleInit {
  private readonly logger = new Logger(TdengineService.name);
  private tdUrl: string;
  private authHeader: string;
  private dbName = 'water_iot';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // 获取配置中的TDengine参数，如果没配则使用默认值
    const host = this.configService.get<string>('tdengine.host') || '127.0.0.1';
    const port = this.configService.get<string>('tdengine.port') || '6041';
    const user = this.configService.get<string>('tdengine.user') || 'root';
    const pass = this.configService.get<string>('tdengine.password') || 'taosdata';

    this.tdUrl = `http://${host}:${port}/rest/sql`;
    this.authHeader = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');

    // 延迟初始化，避免启动时阻塞
    setTimeout(() => {
      this.initDatabaseAndSTable();
    }, 5000);
  }

  private async executeSql(sql: string): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(this.tdUrl, sql, {
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'text/plain',
          },
        }),
      );
      
      if (response.data && response.data.status === 'error') {
        this.logger.error(`TDengine SQL执行失败 (REST Error): ${sql}`, response.data);
        throw new Error(response.data.desc || 'TDengine SQL execution failed');
      }
      
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.logger.warn(`TDengine 服务未启动或无法连接 (${this.tdUrl})，请检查TDengine状态。SQL: ${sql}`);
      } else if (!error.message?.includes('TDengine SQL execution failed')) {
        this.logger.error(`TDengine SQL请求异常: ${sql}`, error.response?.data || error.message);
      }
      throw error;
    }
  }

  private async initDatabaseAndSTable() {
    try {
      await this.executeSql(`CREATE DATABASE IF NOT EXISTS ${this.dbName}`);
      
      // 创建原始数据超级表 meters
      await this.executeSql(
        `CREATE STABLE IF NOT EXISTS ${this.dbName}.meters (ts TIMESTAMP, val DOUBLE) TAGS (device_code NCHAR(100), point_code NCHAR(100))`
      );

      // 创建 5 分钟聚合超级表
      await this.executeSql(
        `CREATE STABLE IF NOT EXISTS ${this.dbName}.meters_5m (ts TIMESTAMP, avg_val DOUBLE, max_val DOUBLE, min_val DOUBLE, spread_val DOUBLE, diff_val DOUBLE) TAGS (device_code NCHAR(100), point_code NCHAR(100))`
      );

      // 创建 1 小时聚合超级表
      await this.executeSql(
        `CREATE STABLE IF NOT EXISTS ${this.dbName}.meters_1h (ts TIMESTAMP, avg_val DOUBLE, max_val DOUBLE, min_val DOUBLE, spread_val DOUBLE, diff_val DOUBLE) TAGS (device_code NCHAR(100), point_code NCHAR(100))`
      );

      // 创建 1 天聚合超级表
      await this.executeSql(
        `CREATE STABLE IF NOT EXISTS ${this.dbName}.meters_1d (ts TIMESTAMP, avg_val DOUBLE, max_val DOUBLE, min_val DOUBLE, spread_val DOUBLE, diff_val DOUBLE) TAGS (device_code NCHAR(100), point_code NCHAR(100))`
      );

      // 创建流计算: 5 分钟
      await this.executeSql(
        `CREATE STREAM IF NOT EXISTS ${this.dbName}.stream_meters_5m INTO ${this.dbName}.meters_5m AS SELECT _wstart as ts, AVG(val) as avg_val, MAX(val) as max_val, MIN(val) as min_val, SPREAD(val) as spread_val, MAX(val)-MIN(val) as diff_val FROM ${this.dbName}.meters PARTITION BY device_code, point_code INTERVAL(5m)`
      );

      // 创建流计算: 1 小时
      await this.executeSql(
        `CREATE STREAM IF NOT EXISTS ${this.dbName}.stream_meters_1h INTO ${this.dbName}.meters_1h AS SELECT _wstart as ts, AVG(val) as avg_val, MAX(val) as max_val, MIN(val) as min_val, SPREAD(val) as spread_val, MAX(val)-MIN(val) as diff_val FROM ${this.dbName}.meters PARTITION BY device_code, point_code INTERVAL(1h)`
      );

      // 创建流计算: 1 天
      await this.executeSql(
        `CREATE STREAM IF NOT EXISTS ${this.dbName}.stream_meters_1d INTO ${this.dbName}.meters_1d AS SELECT _wstart as ts, AVG(val) as avg_val, MAX(val) as max_val, MIN(val) as min_val, SPREAD(val) as spread_val, MAX(val)-MIN(val) as diff_val FROM ${this.dbName}.meters PARTITION BY device_code, point_code INTERVAL(1d)`
      );

      // 创建分区聚合超级表 (5m, 1h, 1d)
      await this.executeSql(
        `CREATE STABLE IF NOT EXISTS ${this.dbName}.zone_meters_5m (ts TIMESTAMP, total_val DOUBLE) TAGS (zone_code NCHAR(100), metric_type NCHAR(100))`
      );
      await this.executeSql(
        `CREATE STABLE IF NOT EXISTS ${this.dbName}.zone_meters_1h (ts TIMESTAMP, total_val DOUBLE) TAGS (zone_code NCHAR(100), metric_type NCHAR(100))`
      );
      await this.executeSql(
        `CREATE STABLE IF NOT EXISTS ${this.dbName}.zone_meters_1d (ts TIMESTAMP, total_val DOUBLE) TAGS (zone_code NCHAR(100), metric_type NCHAR(100))`
      );

      this.logger.log('TDengine 数据库、超级表与流计算 (5m, 1h, 1d) 初始化成功');
    } catch (error) {
      this.logger.warn('TDengine 初始化被挂起，将在服务可用时再次尝试。');
    }
  }

  // 暴露公共方法供查询使用
  async querySql(sql: string) {
    return this.executeSql(sql);
  }

  /**
   * 插入时序数据
   * @param deviceCode 设备编码
   * @param pointCode 测点编码或指标名称
   * @param value 数值
   * @param ts 时间戳 (可选，默认当前时间)
   */
  async insertData(deviceCode: string, pointCode: string, value: number, ts?: Date | string | number) {
    // 确保子表名合法 (TDengine 表名不支持横线，这里替换为下划线)
    const safeDeviceCode = deviceCode.replace(/-/g, '_').toLowerCase();
    const safePointCode = pointCode.replace(/-/g, '_').toLowerCase();
    const tableName = `${this.dbName}.d_${safeDeviceCode}_${safePointCode}`;
    
    let timeStr = 'NOW';
    if (ts) {
      if (ts instanceof Date) {
        timeStr = `${ts.getTime()}`; // 直接使用毫秒时间戳，彻底避免时区问题
      } else if (typeof ts === 'number') {
        timeStr = `${ts}`;
      } else {
        timeStr = `'${ts}'`;
      }
    }

    const sql = `INSERT INTO ${tableName} USING ${this.dbName}.meters TAGS ('${deviceCode}', '${pointCode}') VALUES (${timeStr}, ${value})`;
    return this.executeSql(sql);
  }

  /**
   * 辅助方法：生成分区聚合子表表名
   */
  zoneChildTable(interval: '5m' | '1h' | '1d', zoneCode: string, metricType: string) {
    const safeZone = zoneCode.replace(/-/g, '_').toLowerCase();
    const safeMetric = metricType.replace(/-/g, '_').toLowerCase();
    return `${this.dbName}.z_${interval}_${safeZone}_${safeMetric}`;
  }
}