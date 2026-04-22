import { Injectable, Logger } from '@nestjs/common';
import { TdengineService } from '../tdengine/tdengine.service';
import { InjectRepository } from '@nestjs/typeorm';
import { DataIntegrationMappingEntity } from '@app/common';
import { Repository } from 'typeorm';

@Injectable()
export class ReceiverService {
  private readonly logger = new Logger(ReceiverService.name);

  constructor(
    private readonly tdengineService: TdengineService,
    @InjectRepository(DataIntegrationMappingEntity)
    private readonly mappingRep: Repository<DataIntegrationMappingEntity>,
  ) {}

  /**
   * 模拟数据生成器
   */
  async generateMockData(deviceCode: string, pointCode: string, min: number, max: number, count: number, mockType: string = 'random', baseValue: number = 0, timeRange: string = 'realtime') {
    const results = [];
    const now = new Date();
    
    // 计算时间跨度（毫秒）
    let durationMs = 0;
    if (timeRange === '1h') durationMs = 60 * 60 * 1000;
    else if (timeRange === '1d') durationMs = 24 * 60 * 60 * 1000;
    else if (timeRange === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;
    else if (timeRange === '30d') durationMs = 30 * 24 * 60 * 60 * 1000;

    let currentVal = baseValue;

    if (mockType === 'cumulative') {
      try {
        const safeDeviceCode = deviceCode.replace(/-/g, '_').toLowerCase();
        const safePointCode = pointCode.replace(/-/g, '_').toLowerCase();
        const tableName = `water_iot.d_${safeDeviceCode}_${safePointCode}`;
        const res = await this.tdengineService.querySql(`SELECT LAST_ROW(ts, val) FROM ${tableName}`);
        if (res && res.data && res.data.length > 0) {
          currentVal = res.data[0][1]; 
        }
      } catch (err) {
        // 表不存在或没有数据时，使用传入的 baseValue
      }
    }

    for (let i = 0; i < count; i++) {
      let ts: Date;
      if (timeRange === 'realtime') {
        // 实时模式：从当前往前倒推，每秒一条
        ts = new Date(now.getTime() - (count - i - 1) * 1000);
      } else {
        // 历史跨度模式：将生成条数均匀分布在指定的时间段内
        const stepMs = durationMs / count;
        // i=0 对应最老的时间，i=count-1 对应现在
        ts = new Date(now.getTime() - durationMs + i * stepMs);
      }
      
      let val: number;
      if (mockType === 'cumulative') {
        const step = Number((Math.random() * (max - min) + min).toFixed(2));
        currentVal += step;
        val = Number(currentVal.toFixed(2));
      } else {
        val = Number((Math.random() * (max - min) + min).toFixed(2));
      }

      try {
        // 先插入数据
        await this.tdengineService.insertData(deviceCode, pointCode, val, ts);
        
        // 【重要】在批量导入历史数据时，由于可能跨越了历史的整点边界，我们需要手动触发计算
        // 但为了性能，只在时间跨度大批量插入时（且非最后一秒）异步触发，这里我们采用简单的方案：
        // 让数据写入后自然被下一次查询或流引擎处理，或者在批量插入完成后统一触发
        // (注：TDengine 3.x 流计算在收到乱序/历史数据时，如果超过 watermark，可能会被丢弃。
        // 对于真正的历史数据补录，通常建议直接通过 INSERT INTO ... SELECT 写入聚合表)

        results.push({ timestamp: ts.toLocaleString(), deviceCode, pointCode, value: val, status: 'success' });
      } catch (err) {
        results.push({ timestamp: ts.toLocaleString(), deviceCode, pointCode, value: val, status: 'error', error: err.message });
      }
    }

    // 批量导入历史数据后，为了保证聚合表（5m, 1h, 1d）能查到数据，
    // 我们强制手动把这批刚写入的明细数据“重算”一次，直接塞进聚合表里。
    // 这是因为 TDengine 的 Stream 对太旧的历史数据（超过 watermark）默认不会再处理。
    if (timeRange !== 'realtime' && results.length > 0) {
      try {
        const safeDeviceCode = deviceCode.replace(/-/g, '_').toLowerCase();
        const safePointCode = pointCode.replace(/-/g, '_').toLowerCase();
        const tName = `water_iot.d_${safeDeviceCode}_${safePointCode}`;
        
        // 获取本次生成的起止时间
        const startTs = new Date(now.getTime() - durationMs).toISOString();
        const endTs = now.toISOString();

        // 1. 手动回填 5m 表
        await this.tdengineService.querySql(`
          INSERT INTO water_iot.meters_5m 
          SELECT _wstart as ts, AVG(val) as avg_val, MAX(val) as max_val, MIN(val) as min_val, SPREAD(val) as spread_val, device_code, point_code
          FROM ${tName} 
          WHERE ts >= '${startTs}' AND ts <= '${endTs}' 
          INTERVAL(5m)
        `);

        // 2. 手动回填 1h 表
        await this.tdengineService.querySql(`
          INSERT INTO water_iot.meters_1h 
          SELECT _wstart as ts, AVG(val) as avg_val, MAX(val) as max_val, MIN(val) as min_val, SPREAD(val) as spread_val, device_code, point_code
          FROM ${tName} 
          WHERE ts >= '${startTs}' AND ts <= '${endTs}' 
          INTERVAL(1h)
        `);

        // 3. 手动回填 1d 表
        await this.tdengineService.querySql(`
          INSERT INTO water_iot.meters_1d 
          SELECT _wstart as ts, AVG(val) as avg_val, MAX(val) as max_val, MIN(val) as min_val, SPREAD(val) as spread_val, device_code, point_code
          FROM ${tName} 
          WHERE ts >= '${startTs}' AND ts <= '${endTs}' 
          INTERVAL(1d)
        `);
        
        this.logger.log(`历史数据回填聚合表 (5m, 1h, 1d) 完成: ${deviceCode}-${pointCode}`);
      } catch (err) {
        this.logger.error(`手动回填历史聚合数据失败: ${err.message}`);
      }
    }

    this.logger.log(`成功模拟生成了 ${count} 条 ${deviceCode}-${pointCode} 的数据 (模式: ${mockType})`);
    return results;
  }

  /**
   * 通用 HTTP 数据推送接收器
   */
  async receiveData(taskId: number, payload: any | any[]) {
    // 获取该任务的字段映射配置
    const mappings = await this.mappingRep.find({ where: { taskId } });
    if (!mappings || mappings.length === 0) {
      throw new Error(`任务 ${taskId} 未配置字段映射规则`);
    }

    const dataArray = Array.isArray(payload) ? payload : [payload];
    let successCount = 0;
    let errorCount = 0;

    for (const data of dataArray) {
      try {
        let deviceCode = '';
        let pointCode = '';
        let value: number = null;
        let ts: Date = new Date();

        // 根据映射规则提取字段
        for (const mapping of mappings) {
          const val = data[mapping.sourceField];
          if (val === undefined || val === null) continue;

          switch (mapping.targetField) {
            case 'deviceCode':
              deviceCode = String(val);
              break;
            case 'pointCode':
              pointCode = String(val);
              break;
            case 'value':
              value = Number(val);
              break;
            case 'timestamp':
              ts = new Date(val);
              break;
          }
        }

        if (deviceCode && pointCode && value !== null && !isNaN(value)) {
          await this.tdengineService.insertData(deviceCode, pointCode, value, ts);
          successCount++;
        } else {
          errorCount++;
          this.logger.warn(`数据缺少必要字段: ${JSON.stringify(data)}`);
        }
      } catch (err) {
        errorCount++;
        this.logger.error(`处理数据失败: ${err.message}`, err.stack);
      }
    }

    return { successCount, errorCount, total: dataArray.length };
  }
}