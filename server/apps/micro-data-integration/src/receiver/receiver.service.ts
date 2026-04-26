import { Injectable, Logger } from '@nestjs/common';
import { TdengineService } from '../tdengine/tdengine.service';
import { TdengineAggService } from '../tdengine/tdengine-agg.service';
import { InjectRepository } from '@nestjs/typeorm';
import { DataIntegrationMappingEntity, DataIntegrationTaskEntity } from '@app/common';
import { Repository, DataSource } from 'typeorm';
import { RedisService } from '@app/shared/redis/redis.service';

@Injectable()
export class ReceiverService {
  private readonly logger = new Logger(ReceiverService.name);
  private readonly dirtySetKey = 'iot:agg:dirty:set';

  constructor(
    private readonly tdengineService: TdengineService,
    private readonly tdengineAggService: TdengineAggService,
    @InjectRepository(DataIntegrationMappingEntity)
    private readonly mappingRep: Repository<DataIntegrationMappingEntity>,
    @InjectRepository(DataIntegrationTaskEntity)
    private readonly taskRep: Repository<DataIntegrationTaskEntity>,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
  ) {}

  private async markAggDirty(deviceCode: string, pointCode: string, tsMs: number) {
    const redis = this.redisService.getClient();
    const member = `${deviceCode}|${pointCode}`;
    const rangeKey = `iot:agg:dirty:range:${member}`;

    await redis.sadd(this.dirtySetKey, member);

    const range = await redis.hgetall(rangeKey);
    const minTs = range?.minTs ? parseInt(range.minTs, 10) : tsMs;
    const maxTs = range?.maxTs ? parseInt(range.maxTs, 10) : tsMs;

    await redis.hset(rangeKey, {
      minTs: String(Math.min(minTs, tsMs)),
      maxTs: String(Math.max(maxTs, tsMs)),
    });
  }

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

    // 用于记录这批数据影响到的设备和起止时间（用于回填）
    const affectedDevices = new Map<string, { startTs: number, endTs: number, pointCodes: Set<string> }>();

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
        await this.tdengineService.insertData(deviceCode, pointCode, val, ts);
        await this.markAggDirty(deviceCode, pointCode, ts.getTime());
        
        if (timeRange === 'realtime') {
           await this.redisService.getClient().hset('iot:point:active', pointCode, Date.now().toString());
        }

        // 记录受影响的设备时间范围
        const tsTime = ts.getTime();
        if (!affectedDevices.has(deviceCode)) {
          affectedDevices.set(deviceCode, { startTs: tsTime, endTs: tsTime, pointCodes: new Set([pointCode]) });
        } else {
          const record = affectedDevices.get(deviceCode);
          record.startTs = Math.min(record.startTs, tsTime);
          record.endTs = Math.max(record.endTs, tsTime);
          record.pointCodes.add(pointCode);
        }

        results.push({ timestamp: ts.toLocaleString(), deviceCode, pointCode, value: val, status: 'success' });
      } catch (err) {
        await this.redisService.getClient().lpush('iot:td:retry:list', JSON.stringify({
          deviceCode,
          pointCode,
          val,
          ts: ts.toISOString(),
        }));
        results.push({ timestamp: ts.toLocaleString(), deviceCode, pointCode, value: val, status: 'error', error: err.message });
      }
    }

    // 批量导入历史数据后，为了保证聚合表（5m, 1h, 1d）能查到数据，
    // 我们强制手动把这批刚写入的明细数据“重算”一次，直接塞进聚合表里。
    // 这是因为 TDengine 的 Stream 对太旧的历史数据（超过 watermark）默认不会再处理。
    if (timeRange !== 'realtime' && affectedDevices.size > 0) {
      for (const [dCode, record] of affectedDevices.entries()) {
        for (const pCode of record.pointCodes) {
          await this.tdengineAggService.rebuildAggTables(dCode, pCode, record.startTs, record.endTs);
        }
      }
    }

    this.logger.log(`成功模拟生成了 ${count} 条 ${deviceCode}-${pointCode} 的数据 (模式: ${mockType})`);
    return results;
  }

  /**
   * 模拟营收数据生成器
   */
  async generateMockRevenueData(userNo: string, zoneCode: string, min: number, max: number, count: number, mockType: string, dataType: '1d' | '1mo', baseValue: number, timeRange: string) {
    const results = [];
    const now = new Date();
    
    let durationMs = 0;
    if (timeRange === '1mo') durationMs = 30 * 24 * 60 * 60 * 1000;
    else if (timeRange === '6mo') durationMs = 6 * 30 * 24 * 60 * 60 * 1000;
    else if (timeRange === '1y') durationMs = 365 * 24 * 60 * 60 * 1000;

    let currentVal = baseValue;

    if (mockType === 'cumulative') {
      try {
        const safeUserNo = userNo.replace(/-/g, '_').toLowerCase();
        const safeZoneCode = zoneCode.replace(/-/g, '_').toLowerCase();
        const tableName = `water_iot.rev_${dataType}_${safeUserNo}_${safeZoneCode}`;
        const res = await this.tdengineService.querySql(`SELECT LAST_ROW(ts, val) FROM ${tableName}`);
        if (res && res.data && res.data.length > 0) {
          currentVal = res.data[0][1]; 
        }
      } catch (err) {}
    }

    for (let i = 0; i < count; i++) {
      let ts: Date;
      if (timeRange === 'realtime') {
        ts = new Date(now.getTime() - (count - i - 1) * 1000);
      } else {
        const stepMs = durationMs / count;
        ts = new Date(now.getTime() - durationMs + i * stepMs);
      }
      
      let val: number;
      if (mockType === 'cumulative' || mockType === 'boundary_interpolation' || mockType === 'meter_replace') {
        const step = Number((Math.random() * (max - min) + min).toFixed(2));
        currentVal += step;
        val = Number(currentVal.toFixed(2));
      } else {
        val = Number((Math.random() * (max - min) + min).toFixed(2));
      }

      // 如果是边界/插值模式，只插入头和尾，中间的数据跳过不插入
      if (mockType === 'boundary_interpolation' && i !== 0 && i !== count - 1) {
        continue;
      }

      try {
        await this.tdengineService.insertRevenueData(dataType, userNo, zoneCode, val, ts);
        results.push({ timestamp: ts.toLocaleString(), deviceCode: userNo, pointCode: zoneCode, value: val, status: 'success' });
      } catch (err) {
        results.push({ timestamp: ts.toLocaleString(), deviceCode: userNo, pointCode: zoneCode, value: val, status: 'error', error: err.message });
      }
    }

    // 针对特殊场景：换表、插值等逻辑的演示模拟
    if (mockType === 'meter_replace' && results.length > 0) {
      const midPoint = Math.floor(results.length / 2);
      const item = results[midPoint];
      const oldVal = item.value;
      const newVal = 0; // 新表起度
      try {
        // 插入旧表结底读数（稍微提前一毫秒）
        const oldTs = new Date(new Date(item.timestamp).getTime() - 1);
        await this.tdengineService.insertRevenueData(dataType, userNo, zoneCode, oldVal, oldTs);
        // 插入新表起度读数
        const newTs = new Date(item.timestamp);
        await this.tdengineService.insertRevenueData(dataType, userNo, zoneCode, newVal, newTs);
        
        results.push({ timestamp: oldTs.toLocaleString(), deviceCode: userNo, pointCode: zoneCode, value: oldVal, status: 'success', note: '旧表结底' });
        results.push({ timestamp: newTs.toLocaleString(), deviceCode: userNo, pointCode: zoneCode, value: newVal, status: 'success', note: '新表起度' });
      } catch(err) {
        results.push({ timestamp: item.timestamp, deviceCode: userNo, pointCode: zoneCode, value: newVal, status: 'error', error: err.message, note: '换表失败' });
      }
    } else if (mockType === 'boundary_interpolation' && results.length > 0) {
      // 模拟中间缺失数据，只保留头尾数据用于后续插值测试
      const head = results[0];
      const tail = results[results.length - 1];
      results.length = 0;
      results.push(head, tail);
      this.logger.log(`模拟边界/插值场景：仅保留起止数据`);
    }

    this.logger.log(`成功模拟生成了 ${count} 条营收数据 (用户: ${userNo}, 周期: ${dataType})`);
    return results;
  }

  /**
   * 通用 HTTP 数据推送接收器
   */
  async receiveData(taskId: number, payload: any | any[], autoBackfill: boolean = false, interpolation: boolean = false) {
    const dataList = Array.isArray(payload) ? payload : [payload];
    if (dataList.length === 0) return { success: 0, failed: 0 };

    const task = await this.taskRep.findOne({ where: { id: taskId } });
    if (!task) {
      this.logger.warn(`任务 ${taskId} 不存在`);
      return { success: 0, failed: 0 };
    }

    const mappings = await this.mappingRep.find({ where: { taskId } });
    if (!mappings || mappings.length === 0) {
      this.logger.warn(`任务 ${taskId} 没有配置字段映射，忽略数据接入`);
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    // 用于记录这批数据影响到的设备和起止时间（用于回填）
    const affectedDevices = new Map<string, { startTs: number, endTs: number, pointCodes: Set<string> }>();

    for (const item of dataList) {
      const extracted: any = {};
      for (const map of mappings) {
        const sf = map.sourceField;
        if (sf && sf.startsWith("'") && sf.endsWith("'")) {
          // 固定值（由单引号包裹）
          extracted[map.targetField] = sf.substring(1, sf.length - 1);
        } else {
          // 从数据对象中提取
          extracted[map.targetField] = item[sf];
        }
      }

      // 如果目标是 tdengine
      if (task.targetEntity === 'tdengine') {
        if (!extracted.deviceCode || !extracted.pointCode || extracted.value === undefined) {
          failedCount++;
          continue;
        }

        const deviceCode = String(extracted.deviceCode);
        const pointCode = String(extracted.pointCode);
        const val = Number(extracted.value);
        const ts = extracted.timestamp ? new Date(extracted.timestamp) : new Date();

        try {
          await this.tdengineService.insertData(deviceCode, pointCode, val, ts);
          successCount++;
          await this.markAggDirty(deviceCode, pointCode, ts.getTime());

          if (!autoBackfill) {
             await this.redisService.getClient().hset('iot:point:active', pointCode, Date.now().toString());
          }

          if (autoBackfill) {
            const tsTime = ts.getTime();
            if (!affectedDevices.has(deviceCode)) {
              affectedDevices.set(deviceCode, { startTs: tsTime, endTs: tsTime, pointCodes: new Set([pointCode]) });
            } else {
              const record = affectedDevices.get(deviceCode);
              record.startTs = Math.min(record.startTs, tsTime);
              record.endTs = Math.max(record.endTs, tsTime);
              record.pointCodes.add(pointCode);
            }
          }
        } catch (err) {
          failedCount++;
          await this.redisService.getClient().lpush('iot:td:retry:list', JSON.stringify({
            taskId,
            deviceCode,
            pointCode,
            val,
            ts: ts.toISOString(),
          }));
          this.logger.error(`TDengine 插入失败 (Task: ${taskId})`, err);
        }
      } 
      // 如果目标是 revenue (营收)
      else if (task.targetEntity === 'revenue') {
        if (!extracted.user_no || !extracted.zone_code || extracted.val === undefined || !extracted.ts) {
          failedCount++;
          continue;
        }
        
        try {
          const userNo = String(extracted.user_no);
          const zoneCode = String(extracted.zone_code);
          const val = Number(extracted.val);
          const ts = new Date(extracted.ts);
          // 假设我们这里默认插月度数据，或者根据任务约定
          await this.tdengineService.insertRevenueData('1mo', userNo, zoneCode, val, ts);
          successCount++;
        } catch (err) {
          failedCount++;
          this.logger.error(`Revenue 插入失败 (Task: ${taskId})`, err);
        }
      }
      // 如果目标是业务基础表 (MySQL)
      else if (task.targetEntity) {
        try {
          // 动态生成 INSERT ... ON DUPLICATE KEY UPDATE
          const columns = Object.keys(extracted);
          if (columns.length === 0) continue;

          const values = Object.values(extracted);
          const placeholders = columns.map(() => '?').join(', ');
          const updateStr = columns.map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');
          
          const sql = `INSERT INTO \`${task.targetEntity}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateStr}`;
          
          await this.dataSource.query(sql, values);
          successCount++;
        } catch (err) {
          failedCount++;
          this.logger.error(`基础表写入失败 (Task: ${taskId}, Table: ${task.targetEntity})`, err);
        }
      } else {
        failedCount++;
      }
    }

    // 执行自动历史补录
    if (task.targetEntity === 'tdengine' && autoBackfill && affectedDevices.size > 0) {
      for (const [deviceCode, record] of affectedDevices.entries()) {
        for (const pointCode of record.pointCodes) {
          await this.tdengineAggService.rebuildAggTables(deviceCode, pointCode, record.startTs, record.endTs);
        }
      }
    }

    this.logger.log(`任务 ${taskId} 接入完成：成功 ${successCount} 条，失败 ${failedCount} 条`);
    return { success: successCount, failed: failedCount };
  }

}
