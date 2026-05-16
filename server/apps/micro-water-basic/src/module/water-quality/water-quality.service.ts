import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WaterPointEntity, WaterDeviceEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';
import dayjs from 'dayjs';

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
    private readonly httpService: HttpService,
  ) {}

  async getQualityPoints() {
    const points = await this.pointRep.find({
      where: { type: In(QUALITY_POINT_TYPES), delFlag: '0' },
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

    const realtimeMap = await this.batchFetchRealtime(points.map(p => p.code));

    const groups: Record<string, { deviceCode: string; deviceName: string; points: any[] }> = {};
    for (const p of points) {
      const cfg = TYPE_GROUPS[p.type];
      if (!cfg) continue;
      const devCode = p.deviceCode || '__unbound__';
      if (!groups[devCode]) {
        groups[devCode] = { deviceCode: devCode, deviceName: deviceNameMap.get(devCode) || devCode, points: [] };
      }
      const rt = realtimeMap.get(p.code);
      groups[devCode].points.push({
        id: p.id, name: p.name, code: p.code, type: p.type,
        typeLabel: cfg.label, unit: cfg.unit,
        rangeMin: p.rangeMin ?? cfg.min, rangeMax: p.rangeMax ?? cfg.max,
        deviceCode: p.deviceCode,
        latestValue: rt?.val ?? null,
        latestTime: rt?.ts ?? null,
      });
    }

    return ResultData.ok({
      groups: Object.values(groups),
      total: points.length,
    });
  }

  getTrend(pointCode: string, startDate: string, endDate: string, interval: string) {
    // 趋势数据由前端直接调 /data-integration/query/history 获取
    // 此方法仅返回测点元数据供前端参考
    return ResultData.ok({
      pointCode,
      startDate,
      endDate,
      interval: interval || '1h',
    });
  }

  private async batchFetchRealtime(pointCodes: string[]): Promise<Map<string, { val: number; ts: string }>> {
    const result = new Map<string, { val: number; ts: string }>();
    if (pointCodes.length === 0) return result;

    try {
      const res = await lastValueFrom(
        this.httpService.get('http://localhost:3007/data-integration/query/latest-batch', {
          params: { pointCodes: pointCodes.join(',') },
        }),
      );
      const data = res.data?.data;
      if (Array.isArray(data)) {
        for (const item of data) {
          result.set(item.pointCode, {
            val: item.val != null ? Number(Number(item.val).toFixed(2)) : null,
            ts: item.ts ? dayjs(item.ts).format('YYYY-MM-DD HH:mm:ss') : null,
          });
        }
      }
    } catch (e) {
      this.logger.warn(`批量获取水质实时数据失败: ${e?.message || e}`);
    }
    return result;
  }
}
