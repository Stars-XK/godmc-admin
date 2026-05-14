import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WaterPointEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';

const FLOW_TYPES = ['FLOW', 'FLOW_TOTAL', 'FLOW_INSTANT', 'FLOW_INLET', 'FLOW_OUTLET', 'FLOW_RAW', 'FLOW_CLEAR'];
const TYPE_LABELS: Record<string, string> = {
  FLOW: '流量', FLOW_TOTAL: '累计流量', FLOW_INSTANT: '瞬时流量',
  FLOW_INLET: '进水流量', FLOW_OUTLET: '出水流量', FLOW_RAW: '原水流量', FLOW_CLEAR: '清水流量',
};

@Injectable()
export class FlowMonitorService {
  constructor(
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
  ) {}

  async getFlowPoints() {
    const points = await this.pointRep.find({
      where: { type: In(FLOW_TYPES), delFlag: '0' },
      select: ['id', 'name', 'code', 'type', 'unit', 'rangeMax', 'rangeMin', 'deviceCode'],
      order: { type: 'ASC', name: 'ASC' },
    });

    // 按类型分组
    const groups: Record<string, { typeLabel: string; points: any[] }> = {};
    for (const p of points) {
      const label = TYPE_LABELS[p.type] || p.type;
      if (!groups[p.type]) groups[p.type] = { typeLabel: label, points: [] };
      groups[p.type].points.push({
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
