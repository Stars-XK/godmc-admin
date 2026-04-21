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
  async generateMockData(deviceCode: string, pointCode: string, min: number, max: number, count: number) {
    const results = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      // 模拟生成过去 count 秒的数据，每秒一条
      const ts = new Date(now.getTime() - (count - i - 1) * 1000);
      const val = Number((Math.random() * (max - min) + min).toFixed(2));

      try {
        await this.tdengineService.insertData(deviceCode, pointCode, val, ts);
        results.push({ timestamp: ts.toLocaleString(), deviceCode, pointCode, value: val, status: 'success' });
      } catch (err) {
        results.push({ timestamp: ts.toLocaleString(), deviceCode, pointCode, value: val, status: 'error', error: err.message });
      }
    }

    this.logger.log(`成功模拟生成了 ${count} 条 ${deviceCode}-${pointCode} 的数据`);
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