import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterStationEntity, WaterPointEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';

const STATION_TYPE_LABELS: Record<string, string> = {
  '1': '水厂', '2': '泵站', '3': '二次供水站', '4': '污水处理厂', '5': '调蓄池',
};

@Injectable()
export class PumpStationService {
  constructor(
    @InjectRepository(WaterStationEntity)
    private readonly stationRep: Repository<WaterStationEntity>,
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
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
    // iotStatus: 0=在线 1=异常 2=离线 3=报警
    const online = statusMap.get('0') || 0;
    const offline = statusMap.get('2') || 0;
    const abnormal = statusMap.get('1') || 0;
    const alarm = statusMap.get('3') || 0;
    const onlineRate = total > 0 ? ((online / total) * 100).toFixed(1) : '0';

    return ResultData.ok({
      summary: { total, online, offline, abnormal, alarm, onlineRate },
      stations: stations.map(s => ({
        id: s.id, name: s.name, code: s.code, type: s.type,
        typeLabel: STATION_TYPE_LABELS[s.type] || ('类型' + s.type),
        zoneCode: s.zoneCode, iotStatus: s.iotStatus,
        managerName: s.managerName, managerPhone: s.managerPhone,
        address: s.address, designCapacity: s.designCapacity,
        longitude: s.longitude, latitude: s.latitude,
      })),
    });
  }

  async getStationDetail(stationCode: string) {
    const station = await this.stationRep.findOne({ where: { code: stationCode, delFlag: '0' } });
    if (!station) return ResultData.fail(404, '泵站不存在');

    // 查询关联测点
    const points = await this.pointRep.find({
      where: { deviceCode: stationCode, delFlag: '0' },
      select: ['id', 'name', 'code', 'type', 'unit'],
      order: { type: 'ASC' },
    });

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
      points: points.map(p => ({ id: p.id, name: p.name, code: p.code, type: p.type, unit: p.unit })),
      pointCount: points.length,
    });
  }
}
