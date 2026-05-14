import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WaterPointEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';

// 水质相关测点类型
const QUALITY_POINT_TYPES = [
  'CHLORINE', 'CHLORINE_INLET', 'CHLORINE_OUTLET',
  'TURBIDITY', 'TURBIDITY_INLET', 'TURBIDITY_OUTLET',
  'PH', 'PH_INLET', 'PH_OUTLET',
];

const TYPE_GROUPS: Record<string, { label: string; unit: string; category: string; min: number; max: number }> = {
  CHLORINE: { label: '余氯', unit: 'mg/L', category: '消毒', min: 0.05, max: 4.0 },
  CHLORINE_INLET: { label: '进水余氯', unit: 'mg/L', category: '消毒', min: 0.05, max: 4.0 },
  CHLORINE_OUTLET: { label: '出水余氯', unit: 'mg/L', category: '消毒', min: 0.3, max: 4.0 },
  TURBIDITY: { label: '浊度', unit: 'NTU', category: '物理', min: 0, max: 5.0 },
  TURBIDITY_INLET: { label: '进水浊度', unit: 'NTU', category: '物理', min: 0, max: 10.0 },
  TURBIDITY_OUTLET: { label: '出水浊度', unit: 'NTU', category: '物理', min: 0, max: 1.0 },
  PH: { label: 'pH值', unit: '', category: '化学', min: 6.5, max: 8.5 },
  PH_INLET: { label: '进水pH值', unit: '', category: '化学', min: 6.5, max: 9.5 },
  PH_OUTLET: { label: '出水pH值', unit: '', category: '化学', min: 6.5, max: 8.5 },
};

@Injectable()
export class WaterQualityService {
  private readonly logger = new Logger(WaterQualityService.name);

  constructor(
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
  ) {}

  /** 获取所有水质监测点(按类别分组) */
  async getQualityPoints() {
    const points = await this.pointRep.find({
      where: { type: In(QUALITY_POINT_TYPES), delFlag: '0' },
      select: ['id', 'name', 'code', 'type', 'unit', 'rangeMax', 'rangeMin', 'deviceCode'],
      order: { type: 'ASC', name: 'ASC' },
    });

    // 按类别分组
    const groups: Record<string, { category: string; points: any[] }> = {};
    for (const p of points) {
      const cfg = TYPE_GROUPS[p.type];
      if (!cfg) continue;
      if (!groups[cfg.category]) groups[cfg.category] = { category: cfg.category, points: [] };
      groups[cfg.category].points.push({
        id: p.id,
        name: p.name,
        code: p.code,
        type: p.type,
        typeLabel: cfg.label,
        unit: cfg.unit,
        rangeMin: p.rangeMin ?? cfg.min,
        rangeMax: p.rangeMax ?? cfg.max,
        deviceCode: p.deviceCode,
      });
    }

    return ResultData.ok({
      groups: Object.values(groups),
      total: points.length,
    });
  }

  /** 趋势数据 — 由前端通过 /data-integration/query/history 获取，此处只返回测点信息 */
  async getTrend(pointCode: string, startDate: string, endDate: string, interval: string) {
    const point = await this.pointRep.findOne({ where: { code: pointCode, delFlag: '0' } });
    if (!point) return ResultData.fail(404, '测点不存在');
    const cfg = TYPE_GROUPS[point.type] || { label: point.type, unit: point.unit || '', min: 0, max: 999 };
    return ResultData.ok({
      pointCode: point.code,
      pointName: point.name,
      typeLabel: cfg.label,
      unit: cfg.unit,
      rangeMin: point.rangeMin ?? cfg.min,
      rangeMax: point.rangeMax ?? cfg.max,
      timeRange: { start: startDate, end: endDate },
      interval,
    });
  }
}
