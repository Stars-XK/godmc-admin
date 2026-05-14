import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WaterPointEntity, WaterDeviceEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';

// 8-PRESSURE, 9-PRESSURE_INLET, 10-PRESSURE_OUTLET, 11-PRESSURE_NETWORK, 12-PRESSURE_PUMP
const PRESSURE_TYPES = ['8', '9', '10', '11', '12'];
const TYPE_LABELS: Record<string, string> = {
  '8': '供水压力', '9': '进口压力', '10': '出口压力',
  '11': '管网压力', '12': '泵站压力',
};

@Injectable()
export class PressureService {
  constructor(
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
    @InjectRepository(WaterDeviceEntity)
    private readonly deviceRep: Repository<WaterDeviceEntity>,
  ) {}

  async getPressurePoints() {
    const points = await this.pointRep.find({
      where: { type: In(PRESSURE_TYPES), delFlag: '0' },
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
      const devCode = p.deviceCode || '__unbound__';
      if (!groups[devCode]) {
        groups[devCode] = { deviceCode: devCode, deviceName: deviceNameMap.get(devCode) || devCode, points: [] };
      }
      groups[devCode].points.push({
        id: p.id, name: p.name, code: p.code, type: p.type,
        typeLabel: TYPE_LABELS[p.type] || p.type,
        unit: p.unit || 'MPa', rangeMin: p.rangeMin ?? 0, rangeMax: p.rangeMax ?? 1.6,
        deviceCode: p.deviceCode,
      });
    }

    return ResultData.ok({
      groups: Object.values(groups),
      total: points.length,
    });
  }
}
