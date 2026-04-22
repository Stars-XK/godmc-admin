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
    this.logger.log(`接收到状态批量更新指令: 测点${payload.points?.length||0}个, 设备${payload.devices?.length||0}个, 站点${payload.stations?.length||0}个`);
    
    // 更新测点状态
    if (payload.points && payload.points.length > 0) {
      for (const p of payload.points) {
        await this.pointRep.update({ code: p.code }, { status: p.status });
      }
    }

    // 更新设备状态
    if (payload.devices && payload.devices.length > 0) {
      for (const d of payload.devices) {
        await this.deviceRep.update({ code: d.code }, { status: d.status });
      }
    }

    // 更新站点状态
    if (payload.stations && payload.stations.length > 0) {
      for (const s of payload.stations) {
        await this.stationRep.update({ code: s.code }, { status: s.status });
      }
    }

    return { success: true };
  }
}
