import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WaterPointEntity, WaterDeviceEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';

// 1-FLOW, 2-FLOW_TOTAL, 3-FLOW_INSTANT, 4-FLOW_INLET, 5-FLOW_OUTLET, 6-FLOW_RAW, 7-FLOW_CLEAR
const FLOW_TYPES = ['1', '2', '3', '4', '5', '6', '7'];
const TYPE_LABELS: Record<string, string> = {
  '1': '流量', '2': '累计流量', '3': '瞬时流量',
  '4': '进水流量', '5': '出水流量', '6': '原水流量', '7': '清水流量',
};

@Injectable()
export class FlowMonitorService {
  constructor(
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
    @InjectRepository(WaterDeviceEntity)
    private readonly deviceRep: Repository<WaterDeviceEntity>,
  ) {}

  async getFlowPoints() {
    const points = await this.pointRep.find({
      where: { type: In(FLOW_TYPES), delFlag: '0' },
      select: ['id', 'name', 'code', 'type', 'unit', 'rangeMax', 'rangeMin', 'deviceCode'],
      order: { deviceCode: 'ASC', type: 'ASC', name: 'ASC' },
    });

    const devCodes = [...new Set(points.map(p => p.deviceCode).filter(Boolean))] as string[];
    const deviceNameMap = new Map<string, string>();
    if (devCodes.length > 0) {
      const devices = await this.deviceRep
        .createQueryBuilder('d').select(['d.code', 'd.name']).where('d.code IN (:...codes)', { codes: devCodes }).getMany();
      devices.forEach(d => deviceNameMap.set(d.code, d.name));
    }

    const groups: Record<string, { deviceCode: string; deviceName: string; points: any[] }> = {};
    for (const p of points) {
      const label = TYPE_LABELS[p.type] || p.type;
      const devCode = p.deviceCode || '__unbound__';
      if (!groups[devCode]) {
        groups[devCode] = { deviceCode: devCode, deviceName: deviceNameMap.get(devCode) || devCode, points: [] };
      }
      groups[devCode].points.push({
        id: p.id, name: p.name, code: p.code, type: p.type, typeLabel: label,
        unit: p.unit || 'm³/h', rangeMin: p.rangeMin ?? 0, rangeMax: p.rangeMax ?? 9999,
        deviceCode: p.deviceCode,
      });
    }

    return ResultData.ok({
      groups: Object.values(groups),
      total: points.length,
    });
  }
}
