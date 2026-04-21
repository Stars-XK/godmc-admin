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
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.logger.warn(`TDengine 服务未启动或无法连接 (${this.tdUrl})，请检查TDengine状态。SQL: ${sql}`);
      } else {
        this.logger.error(`TDengine SQL执行失败: ${sql}`, error.response?.data || error.message);
      }
      throw error;
    }
  }

  private async initDatabaseAndSTable() {
    try {
      await this.executeSql(`CREATE DATABASE IF NOT EXISTS ${this.dbName}`);
      // 创建超级表 meters，包含时间戳 ts 和值 val，以及标签 device_code 和 point_code
      await this.executeSql(
        `CREATE STABLE IF NOT EXISTS ${this.dbName}.meters (ts TIMESTAMP, val DOUBLE) TAGS (device_code NCHAR(100), point_code NCHAR(100))`
      );
      this.logger.log('TDengine 数据库与超级表初始化成功');
    } catch (error) {
      this.logger.warn('TDengine 初始化被挂起，将在服务可用时再次尝试。');
    }
  }

  /**
   * 插入时序数据
   * @param deviceCode 设备编码
   * @param pointCode 测点编码或指标名称
   * @param value 数值
   * @param ts 时间戳 (可选，默认当前时间)
   */
  async insertData(deviceCode: string, pointCode: string, value: number, ts?: Date | string) {
    // 确保子表名合法 (TDengine 表名不支持横线，这里替换为下划线)
    const safeDeviceCode = deviceCode.replace(/-/g, '_').toLowerCase();
    const safePointCode = pointCode.replace(/-/g, '_').toLowerCase();
    const tableName = `${this.dbName}.d_${safeDeviceCode}_${safePointCode}`;
    
    let timeStr = 'NOW';
    if (ts) {
      if (ts instanceof Date) {
        timeStr = `'${ts.toISOString().replace('T', ' ').replace('Z', '')}'`; // 格式 2024-01-01 10:00:00.000
      } else {
        timeStr = `'${ts}'`;
      }
    }

    const sql = `INSERT INTO ${tableName} USING ${this.dbName}.meters TAGS ('${deviceCode}', '${pointCode}') VALUES (${timeStr}, ${value})`;
    return this.executeSql(sql);
  }
}