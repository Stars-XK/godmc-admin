import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TdengineService implements OnModuleInit {
  private readonly logger = new Logger(TdengineService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting TDengine Alarm Streams Initialization...');
    await this.initAlarmStreams();
  }

  private async query(sql: string): Promise<any> {
    const host = this.configService.get('tdengine.host', '127.0.0.1');
    const port = this.configService.get('tdengine.restPort', 6041);
    const user = this.configService.get('tdengine.user', 'root');
    const password = this.configService.get('tdengine.password', 'taosdata');

    const url = `http://${host}:${port}/rest/sql`;
    const token = Buffer.from(`${user}:${password}`).toString('base64');

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, sql, {
          headers: {
            Authorization: `Basic ${token}`,
            'Content-Type': 'text/plain',
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new Error(`TDengine Query Failed: ${error.message}`);
    }
  }

  async initAlarmStreams() {
    const initSqls = [
      `CREATE DATABASE IF NOT EXISTS water_db`,
      `USE water_db`,
      `CREATE STABLE IF NOT EXISTS raw_metrics (ts TIMESTAMP, val DOUBLE) TAGS (device_id BINARY(64), metric_name BINARY(64))`,
      
      // 1. 创建聚合结果超级表
      `CREATE STABLE IF NOT EXISTS st_metric_ma (ts TIMESTAMP, val_ma DOUBLE) TAGS (device_id BINARY(64), metric_name BINARY(64))`,
      `CREATE STABLE IF NOT EXISTS st_metric_slope (ts TIMESTAMP, val_slope DOUBLE) TAGS (device_id BINARY(64), metric_name BINARY(64))`,
      `CREATE STABLE IF NOT EXISTS st_metric_diff (ts TIMESTAMP, val_diff DOUBLE) TAGS (device_id BINARY(64), metric_name BINARY(64))`,
      
      // 2. 创建流计算任务
      `CREATE STREAM IF NOT EXISTS stream_ma_5m INTO st_metric_ma AS SELECT _wstart AS ts, AVG(val) AS val_ma FROM raw_metrics PARTITION BY device_id, metric_name INTERVAL(5m) SLIDING(1m)`,
      `CREATE STREAM IF NOT EXISTS stream_slope_5m INTO st_metric_slope AS SELECT _wstart AS ts, DERIVATIVE(val, 1s, 0) AS val_slope FROM raw_metrics PARTITION BY device_id, metric_name INTERVAL(5m) SLIDING(1m)`,
      `CREATE STREAM IF NOT EXISTS stream_diff_1m INTO st_metric_diff AS SELECT _wstart AS ts, SPREAD(val) AS val_diff FROM raw_metrics PARTITION BY device_id, metric_name INTERVAL(1m)`,
      
      // 3. 创建 TMQ Topic 供 micro-alarm 订阅
      `CREATE TOPIC IF NOT EXISTS topic_alarm_ma AS SELECT * FROM st_metric_ma`,
      `CREATE TOPIC IF NOT EXISTS topic_alarm_slope AS SELECT * FROM st_metric_slope`,
      `CREATE TOPIC IF NOT EXISTS topic_alarm_diff AS SELECT * FROM st_metric_diff`
    ];

    for (const sql of initSqls) {
      try {
        await this.query(sql); 
        this.logger.log(`[TDengine] 成功初始化告警流: ${sql.substring(0, 45)}...`);
      } catch (error) {
        this.logger.error(`[TDengine] 告警流初始化失败: ${error.message}`);
      }
    }
  }
}