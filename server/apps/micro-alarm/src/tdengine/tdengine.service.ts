import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TdengineService implements OnModuleInit {
  private readonly logger = new Logger(TdengineService.name);
  private dbName = 'water_iot';  // 统一使用与 micro-data-integration 相同的数据库
  private tdUrl: string;
  private authHeader: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async onModuleInit() {
    const host = this.configService.get('tdengine.host', '127.0.0.1');
    const port = this.configService.get('tdengine.restPort', 6041);
    const user = this.configService.get('tdengine.user', 'root');
    const password = this.configService.get('tdengine.password', 'taosdata');

    this.tdUrl = `http://${host}:${port}/rest/sql`;
    this.authHeader = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');

    // 延迟初始化，避免启动时阻塞
    setTimeout(() => {
      this.ensureDatabase();
    }, 5000);

    this.logger.log(`[Alarm Tdengine] 已连接 TDengine REST API: ${this.tdUrl}, 数据库: ${this.dbName}`);
  }

  private async ensureDatabase() {
    try {
      await this.query(`CREATE DATABASE IF NOT EXISTS ${this.dbName}`);
      this.logger.log(`[Alarm Tdengine] 数据库 ${this.dbName} 就绪`);
    } catch (error) {
      this.logger.warn(`[Alarm Tdengine] 数据库初始化失败，将在服务可用时重试: ${error.message}`);
    }
  }

  /**
   * 执行 TDengine SQL 查询 (通过 REST API)
   */
  async query(sql: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.tdUrl, sql, {
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'text/plain',
          },
          timeout: 15000,
        }),
      );
      if (response.data && response.data.status === 'error') {
        this.logger.error(`TDengine SQL 执行失败: ${sql.substring(0, 80)}...`, response.data);
        throw new Error(response.data.desc || 'TDengine SQL execution failed');
      }
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.logger.warn(`TDengine 服务不可用 (${this.tdUrl})`);
      } else if (!error.message?.includes('TDengine SQL execution failed')) {
        this.logger.error(`TDengine SQL 请求异常: ${sql.substring(0, 80)}...`, error.message);
      }
      throw error;
    }
  }

  /**
   * 获取最近时间的 5 分钟聚合数据（用于报警轮询）
   * @param lastMinutes 拉取最近多少分钟的数据，默认 5
   */
  async getRecentAggregatedData(lastMinutes: number = 5): Promise<any[]> {
    try {
      const sql = `
        SELECT ts, device_code, point_code, avg_val, max_val, min_val, spread_val, diff_val
        FROM ${this.dbName}.meters_5m
        WHERE ts >= NOW - ${lastMinutes}m
        ORDER BY ts DESC
        LIMIT 500
      `;
      const result = await this.query(sql);
      if (result && result.data) {
        return result.data.map((row: any) => ({
          ts: row[0],
          deviceCode: row[1],
          pointCode: row[2],
          avgVal: row[3],
          maxVal: row[4],
          minVal: row[5],
          spreadVal: row[6],
          diffVal: row[7],
        }));
      }
      return [];
    } catch (error) {
      this.logger.warn(`获取聚合数据失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取指定设备的最近原始数据（用于即时评估）
   */
  async getDeviceLatestData(deviceCode: string, pointCode: string): Promise<any[]> {
    try {
      const safeDevice = deviceCode.replace(/-/g, '_').toLowerCase();
      const safePoint = pointCode.replace(/-/g, '_').toLowerCase();
      const tableName = `${this.dbName}.d_${safeDevice}_${safePoint}`;
      const sql = `
        SELECT ts, val
        FROM ${tableName}
        ORDER BY ts DESC
        LIMIT 10
      `;
      const result = await this.query(sql);
      if (result && result.data) {
        return result.data.map((row: any) => ({ ts: row[0], val: row[1] }));
      }
      return [];
    } catch (error) {
      this.logger.warn(`获取设备最新数据失败 device=${deviceCode} point=${pointCode}: ${error.message}`);
      return [];
    }
  }
}
