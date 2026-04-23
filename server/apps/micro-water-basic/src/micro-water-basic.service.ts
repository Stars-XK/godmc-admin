import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WaterPointEntity, WaterDeviceEntity, WaterStationEntity } from '@app/common';

@Injectable()
export class MicroWaterBasicService {
  private readonly logger = new Logger(MicroWaterBasicService.name);

  constructor(
    @InjectRepository(WaterPointEntity) private readonly pointRep: Repository<WaterPointEntity>,
    @InjectRepository(WaterDeviceEntity) private readonly deviceRep: Repository<WaterDeviceEntity>,
    @InjectRepository(WaterStationEntity) private readonly stationRep: Repository<WaterStationEntity>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  // 辅助方法：分批构造并执行 CASE WHEN 批量更新 SQL
  private async executeBatchUpdate(
    repository: any,
    tableName: string,
    items: { code: string; iotStatus: string }[],
  ): Promise<number> {
    if (!items || items.length === 0) return 0;

    let affectedRows = 0;
    // 分批处理，防止 SQL 语句过长或参数过多（MySQL 默认参数上限 65535）
    const chunkSize = 500;
    
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      
      const whenStatements: string[] = [];
      const parameters: any[] = [];
      const codes: string[] = [];

      for (const item of chunk) {
        whenStatements.push('WHEN ? THEN ?');
        parameters.push(item.code, item.iotStatus);
        codes.push(item.code);
      }

      parameters.push(...codes);
      const inPlaceholders = codes.map(() => '?').join(',');

      const sql = `
        UPDATE ${tableName}
        SET iot_status = CASE code
          ${whenStatements.join(' ')}
          ELSE iot_status
        END
        WHERE code IN (${inPlaceholders})
      `;

      try {
        const result = await repository.query(sql, parameters);
        // mysql2 返回的结果中 affectedRows 存放在 result.affectedRows
        affectedRows += result?.affectedRows || chunk.length;
      } catch (error) {
        this.logger.error(`批量更新 ${tableName} 失败: ${error.message}`);
      }
    }
    
    return affectedRows;
  }

  async batchUpdateStatus(payload: { points: {code: string, iotStatus: string}[], devices: {code: string, iotStatus: string}[], stations: {code: string, iotStatus: string}[] }) {
    const start = Date.now();
    const pTotal = payload.points?.length || 0;
    const dTotal = payload.devices?.length || 0;
    const sTotal = payload.stations?.length || 0;

    this.logger.log(`接收到状态批量更新指令: 测点${pTotal}个, 设备${dTotal}个, 站点${sTotal}个`);

    let pOk = 0;
    let dOk = 0;
    let sOk = 0;

    // 使用原生 SQL 批量更新测点
    if (pTotal > 0) {
      pOk = await this.executeBatchUpdate(this.pointRep, 'water_point', payload.points);
    }

    // 使用原生 SQL 批量更新设备
    if (dTotal > 0) {
      dOk = await this.executeBatchUpdate(this.deviceRep, 'water_device', payload.devices);
    }

    // 使用原生 SQL 批量更新站点
    if (sTotal > 0) {
      sOk = await this.executeBatchUpdate(this.stationRep, 'water_station', payload.stations);
    }

    this.logger.log(`状态回写完成: 测点${pOk}/${pTotal} 设备${dOk}/${dTotal} 站点${sOk}/${sTotal} 耗时${Date.now() - start}ms`);
    return { success: true };
  }
}
