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

  async batchUpdateStatus(payload: { points: {code: string, status: string}[], devices: {code: string, status: string}[], stations: {code: string, status: string}[] }) {
    const start = Date.now();
    const pTotal = payload.points?.length || 0;
    const dTotal = payload.devices?.length || 0;
    const sTotal = payload.stations?.length || 0;
    this.logger.log(`接收到状态批量更新指令: 测点${pTotal}个, 设备${dTotal}个, 站点${sTotal}个`);

    let pOk = 0;
    let dOk = 0;
    let sOk = 0;
    
    // 更新测点状态
    if (payload.points && payload.points.length > 0) {
      for (const p of payload.points) {
        const res = await this.pointRep.update({ code: p.code }, { status: p.status });
        if ((res as any)?.affected) pOk += (res as any).affected;
      }
    }

    // 更新设备状态
    if (payload.devices && payload.devices.length > 0) {
      for (const d of payload.devices) {
        const res = await this.deviceRep.update({ code: d.code }, { status: d.status });
        if ((res as any)?.affected) dOk += (res as any).affected;
      }
    }

    // 更新站点状态
    if (payload.stations && payload.stations.length > 0) {
      for (const s of payload.stations) {
        const res = await this.stationRep.update({ code: s.code }, { status: s.status });
        if ((res as any)?.affected) sOk += (res as any).affected;
      }
    }

    this.logger.log(`状态回写完成: 测点${pOk}/${pTotal} 设备${dOk}/${dTotal} 站点${sOk}/${sTotal} 耗时${Date.now() - start}ms`);
    return { success: true };
  }
}
