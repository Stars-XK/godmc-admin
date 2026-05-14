import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WaterPointEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';

const PRESSURE_TYPES = ['PRESSURE', 'PRESSURE_INLET', 'PRESSURE_OUTLET', 'PRESSURE_NETWORK', 'PRESSURE_PUMP'];
const TYPE_LABELS: Record<string, string> = {
  PRESSURE: '供水压力', PRESSURE_INLET: '进口压力', PRESSURE_OUTLET: '出口压力',
  PRESSURE_NETWORK: '管网压力', PRESSURE_PUMP: '泵站压力',
};

@Injectable()
export class PressureService {
  constructor(
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
  ) {}

  async getPressurePoints() {
    const points = await this.pointRep.find({
      where: { type: In(PRESSURE_TYPES), delFlag: '0' },
      select: ['id', 'name', 'code', 'type', 'unit', 'rangeMax', 'rangeMin', 'deviceCode'],
      order: { type: 'ASC', name: 'ASC' },
    });

    return ResultData.ok({
      points: points.map(p => ({
        id: p.id, name: p.name, code: p.code, type: p.type,
        typeLabel: TYPE_LABELS[p.type] || p.type,
        unit: p.unit || 'MPa', rangeMin: p.rangeMin ?? 0, rangeMax: p.rangeMax ?? 1.6,
        deviceCode: p.deviceCode,
      })),
      total: points.length,
    });
  }
}
