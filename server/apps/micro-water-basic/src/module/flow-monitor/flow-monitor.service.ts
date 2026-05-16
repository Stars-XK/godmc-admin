import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WaterPointEntity, WaterDeviceEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';
import dayjs from 'dayjs';

const FLOW_TYPES = ['1', '2', '3', '4', '5', '6', '7'];
const TYPE_LABELS: Record<string, string> = {
  '1': '流量', '2': '累计流量', '3': '瞬时流量',
  '4': '进水流量', '5': '出水流量', '6': '原水流量', '7': '清水流量',
};

@Injectable()
export class FlowMonitorService {
  private readonly logger = new Logger(FlowMonitorService.name);

  constructor(
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
    @InjectRepository(WaterDeviceEntity)
    private readonly deviceRep: Repository<WaterDeviceEntity>,
    private readonly httpService: HttpService,
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

    // 批量获取实时数据
    const realtimeMap = await this.batchFetchRealtime(points.map(p => p.code));

    const groups: Record<string, { deviceCode: string; deviceName: string; points: any[] }> = {};
    for (const p of points) {
      const label = TYPE_LABELS[p.type] || p.type;
      const devCode = p.deviceCode || '__unbound__';
      if (!groups[devCode]) {
        groups[devCode] = { deviceCode: devCode, deviceName: deviceNameMap.get(devCode) || devCode, points: [] };
      }
      const rt = realtimeMap.get(p.code);
      groups[devCode].points.push({
        id: p.id, name: p.name, code: p.code, type: p.type, typeLabel: label,
        unit: p.unit || 'm³/h', rangeMin: p.rangeMin ?? 0, rangeMax: p.rangeMax ?? 9999,
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
            val: item.val != null ? Number(Number(item.val).toFixed(3)) : null,
            ts: item.ts ? dayjs(item.ts).format('YYYY-MM-DD HH:mm:ss') : null,
          });
        }
      }
    } catch (e) {
      this.logger.warn(`批量获取流量实时数据失败: ${e?.message || e}`);
    }
    return result;
  }
}
