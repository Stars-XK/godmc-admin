import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WaterPointEntity, WaterDeviceEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';

// 水质相关测点类型 (字典 water_point_type 对应数值)
// 17-CHLORINE, 18-TURBIDITY, 19-PH, 20-PERMANGANATE, 21-AMMONIA_NITROGEN, 22-DISSOLVED_OXYGEN, 23-TEMPERATURE
// 34-CHLORINE_INLET, 35-CHLORINE_OUTLET, 36-TURBIDITY_INLET, 37-TURBIDITY_OUTLET, 38-PH_INLET, 39-PH_OUTLET
// 41-PERMANGANATE_INLET, 42-PERMANGANATE_OUTLET, 43-AMMONIA_NITROGEN_INLET, 44-AMMONIA_NITROGEN_OUTLET
// 45-DISSOLVED_OXYGEN_INLET, 46-DISSOLVED_OXYGEN_OUTLET, 47-TEMPERATURE_INLET, 48-TEMPERATURE_OUTLET
const QUALITY_POINT_TYPES = [
  '17', '18', '19', '20', '21', '22', '23',
  '34', '35', '36', '37', '38', '39',
  '41', '42', '43', '44', '45', '46', '47', '48',
];

const TYPE_GROUPS: Record<string, { label: string; unit: string; category: string; min: number; max: number }> = {
  '17': { label: '余氯', unit: 'mg/L', category: '消毒', min: 0.05, max: 4.0 },
  '34': { label: '进水余氯', unit: 'mg/L', category: '消毒', min: 0.05, max: 4.0 },
  '35': { label: '出水余氯', unit: 'mg/L', category: '消毒', min: 0.3, max: 4.0 },
  '18': { label: '浊度', unit: 'NTU', category: '物理', min: 0, max: 5.0 },
  '36': { label: '进水浊度', unit: 'NTU', category: '物理', min: 0, max: 10.0 },
  '37': { label: '出水浊度', unit: 'NTU', category: '物理', min: 0, max: 1.0 },
  '19': { label: 'pH值', unit: '', category: '化学', min: 6.5, max: 8.5 },
  '38': { label: '进水pH值', unit: '', category: '化学', min: 6.5, max: 9.5 },
  '39': { label: '出水pH值', unit: '', category: '化学', min: 6.5, max: 8.5 },
  '20': { label: '高锰酸盐', unit: 'mg/L', category: '化学', min: 0, max: 5.0 },
  '41': { label: '进水高锰酸盐', unit: 'mg/L', category: '化学', min: 0, max: 6.0 },
  '42': { label: '出水高锰酸盐', unit: 'mg/L', category: '化学', min: 0, max: 5.0 },
  '21': { label: '氨氮', unit: 'mg/L', category: '化学', min: 0, max: 1.0 },
  '43': { label: '进水氨氮', unit: 'mg/L', category: '化学', min: 0, max: 1.5 },
  '44': { label: '出水氨氮', unit: 'mg/L', category: '化学', min: 0, max: 1.0 },
  '22': { label: '溶解氧', unit: 'mg/L', category: '化学', min: 5.0, max: 999 },
  '45': { label: '进水溶解氧', unit: 'mg/L', category: '化学', min: 4.0, max: 999 },
  '46': { label: '出水溶解氧', unit: 'mg/L', category: '化学', min: 5.0, max: 999 },
  '23': { label: '温度', unit: '℃', category: '物理', min: 0, max: 35 },
  '47': { label: '进水温度', unit: '℃', category: '物理', min: 0, max: 40 },
  '48': { label: '出水温度', unit: '℃', category: '物理', min: 0, max: 35 },
};

@Injectable()
export class WaterQualityService {
  private readonly logger = new Logger(WaterQualityService.name);

  constructor(
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
    @InjectRepository(WaterDeviceEntity)
    private readonly deviceRep: Repository<WaterDeviceEntity>,
  ) {}

  /** 获取所有水质监测点(按所属设备分组) */
  async getQualityPoints() {
    const points = await this.pointRep.find({
      where: { type: In(QUALITY_POINT_TYPES), delFlag: '0' },
      select: ['id', 'name', 'code', 'type', 'unit', 'rangeMax', 'rangeMin', 'deviceCode'],
      order: { deviceCode: 'ASC', type: 'ASC', name: 'ASC' },
    });

    // 收集所有 deviceCode 并查设备名
    const devCodes = [...new Set(points.map(p => p.deviceCode).filter(Boolean))] as string[];
    const deviceNameMap = new Map<string, string>();
    if (devCodes.length > 0) {
      const devices = await this.deviceRep
        .createQueryBuilder('d').select(['d.code', 'd.name']).where('d.code IN (:...codes)', { codes: devCodes }).getMany();
      devices.forEach(d => deviceNameMap.set(d.code, d.name));
    }

    // 按设备分组
    const groups: Record<string, { deviceCode: string; deviceName: string; points: any[] }> = {};
    for (const p of points) {
      const cfg = TYPE_GROUPS[p.type];
      if (!cfg) continue;
      const devCode = p.deviceCode || '__unbound__';
      if (!groups[devCode]) {
        groups[devCode] = {
          deviceCode: devCode,
          deviceName: deviceNameMap.get(devCode) || devCode,
          points: [],
        };
      }
      groups[devCode].points.push({
        id: p.id, name: p.name, code: p.code, type: p.type,
        typeLabel: cfg.label, unit: cfg.unit,
        rangeMin: p.rangeMin ?? cfg.min, rangeMax: p.rangeMax ?? cfg.max,
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
