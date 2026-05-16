import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WaterStationEntity, WaterPointEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';
import dayjs from 'dayjs';

const STATION_TYPE_LABELS: Record<string, string> = {
  '1': '水厂', '2': '泵站', '3': '二次供水站', '4': '污水处理厂', '5': '调蓄池',
};

// 泵站关键指标测点类型
const PUMP_KEY_POINT_TYPES = ['8', '9', '10', '12', '1', '3', '4']; // 压力/流量相关

@Injectable()
export class PumpStationService {
  private readonly logger = new Logger(PumpStationService.name);

  constructor(
    @InjectRepository(WaterStationEntity)
    private readonly stationRep: Repository<WaterStationEntity>,
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
    private readonly httpService: HttpService,
  ) {}

  async getStationsWithStatus(params?: { pageNum?: number; pageSize?: number; keyword?: string }) {
    const { pageNum = 1, pageSize = 20, keyword } = params || {};

    const qb = this.stationRep.createQueryBuilder('s')
      .where('s.delFlag = :df', { df: '0' });
    if (keyword) {
      qb.andWhere('(s.name LIKE :kw OR s.code LIKE :kw OR s.managerName LIKE :kw)', { kw: `%${keyword}%` });
    }

    const [stations, total, statusCounts] = await Promise.all([
      qb.clone()
        .select(['s.id', 's.name', 's.code', 's.type', 's.zoneCode', 's.iotStatus', 's.managerName', 's.managerPhone', 's.address', 's.designCapacity', 's.longitude', 's.latitude'])
        .orderBy('s.sort', 'ASC')
        .addOrderBy('s.name', 'ASC')
        .skip((pageNum - 1) * pageSize)
        .take(pageSize)
        .getMany(),
      qb.getCount(),
      this.stationRep
        .createQueryBuilder('s')
        .select('s.iotStatus', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('s.delFlag = :df', { df: '0' })
        .groupBy('s.iotStatus')
        .getRawMany(),
    ]);

    const statusMap = new Map<string, number>();
    statusCounts.forEach((r: any) => statusMap.set(r.status, Number(r.count)));
    const online = statusMap.get('0') || 0;
    const offline = statusMap.get('2') || 0;
    const abnormal = statusMap.get('1') || 0;
    const alarm = statusMap.get('3') || 0;
    const onlineRate = total > 0 ? ((online / total) * 100).toFixed(1) : '0';

    // 获取所有站点的关键测点实时数据
    const stationCodes = stations.map(s => s.code);
    const stationRealtimeMap = await this.batchFetchStationRealtime(stationCodes);

    return ResultData.ok({
      summary: { total, online, offline, abnormal, alarm, onlineRate },
      stations: stations.map(s => ({
        id: s.id, name: s.name, code: s.code, type: s.type,
        typeLabel: STATION_TYPE_LABELS[s.type] || ('类型' + s.type),
        zoneCode: s.zoneCode, iotStatus: s.iotStatus,
        managerName: s.managerName, managerPhone: s.managerPhone,
        address: s.address, designCapacity: s.designCapacity,
        longitude: s.longitude, latitude: s.latitude,
        realtime: stationRealtimeMap.get(s.code) || [],
      })),
    });
  }

  async getStationDetail(stationCode: string) {
    const station = await this.stationRep.findOne({ where: { code: stationCode, delFlag: '0' } });
    if (!station) return ResultData.fail(404, '泵站不存在');

    const points = await this.pointRep.find({
      where: { deviceCode: stationCode, delFlag: '0' },
      select: ['id', 'name', 'code', 'type', 'unit'],
      order: { type: 'ASC' },
    });

    // 获取所有关联测点的实时数据
    const pointCodes = points.map(p => p.code);
    const realtimeMap = await this.batchFetchRealtime(pointCodes);

    return ResultData.ok({
      station: {
        id: station.id, name: station.name, code: station.code, type: station.type,
        typeLabel: STATION_TYPE_LABELS[station.type] || ('类型' + station.type),
        zoneCode: station.zoneCode, iotStatus: station.iotStatus,
        managerName: station.managerName, managerPhone: station.managerPhone,
        address: station.address, designCapacity: station.designCapacity,
        commissioningDate: station.commissioningDate,
        longitude: station.longitude, latitude: station.latitude,
      },
      points: points.map(p => {
        const rt = realtimeMap.get(p.code);
        return {
          id: p.id, name: p.name, code: p.code, type: p.type, unit: p.unit,
          latestValue: rt?.val ?? null,
          latestTime: rt?.ts ?? null,
        };
      }),
      pointCount: points.length,
    });
  }

  /** 批量获取站点关联测点的实时数据，按站点分组 */
  private async batchFetchStationRealtime(stationCodes: string[]): Promise<Map<string, any[]>> {
    const result = new Map<string, any[]>();
    if (stationCodes.length === 0) return result;

    try {
      // 查找所有站点关联的关键测点
      const points = await this.pointRep.find({
        where: { deviceCode: In(stationCodes), type: In(PUMP_KEY_POINT_TYPES), delFlag: '0' },
        select: ['code', 'name', 'type', 'unit', 'deviceCode'],
      });

      if (points.length === 0) return result;

      const realtimeMap = await this.batchFetchRealtime(points.map(p => p.code));

      for (const p of points) {
        const stationCode = p.deviceCode;
        if (!result.has(stationCode)) result.set(stationCode, []);
        const rt = realtimeMap.get(p.code);
        result.get(stationCode)!.push({
          pointCode: p.code,
          pointName: p.name,
          type: p.type,
          unit: p.unit,
          latestValue: rt?.val ?? null,
          latestTime: rt?.ts ?? null,
        });
      }
    } catch (e) {
      this.logger.warn(`批量获取泵站实时数据失败: ${e?.message || e}`);
    }
    return result;
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
      this.logger.warn(`批量获取实时数据失败: ${e?.message || e}`);
    }
    return result;
  }
}
