import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, IsNull } from 'typeorm';
import { ResultData } from '@app/common';
import {
  WaterZoneEntity,
  WaterStationEntity,
  WaterDeviceEntity,
  WaterPipeEntity,
  SysAlarmHistoryEntity,
} from '@app/common';

interface BBox {
  swLng: number;
  swLat: number;
  neLng: number;
  neLat: number;
}

@Injectable()
export class GisService {
  constructor(
    @InjectRepository(WaterZoneEntity)
    private readonly zoneRep: Repository<WaterZoneEntity>,
    @InjectRepository(WaterStationEntity)
    private readonly stationRep: Repository<WaterStationEntity>,
    @InjectRepository(WaterDeviceEntity)
    private readonly deviceRep: Repository<WaterDeviceEntity>,
    @InjectRepository(WaterPipeEntity)
    private readonly pipeRep: Repository<WaterPipeEntity>,
    @InjectRepository(SysAlarmHistoryEntity)
    private readonly alarmHistoryRep: Repository<SysAlarmHistoryEntity>,
  ) {}

  private makeBboxWhere(qb: any, alias: string, lngCol: string, latCol: string, bbox?: BBox) {
    if (!bbox) return;
    qb.andWhere(
      `CAST(${alias}.${lngCol} AS DECIMAL(12,8)) BETWEEN :swLng AND :neLng`,
      { swLng: bbox.swLng, neLng: bbox.neLng },
    ).andWhere(
      `CAST(${alias}.${latCol} AS DECIMAL(12,8)) BETWEEN :swLat AND :neLat`,
      { swLat: bbox.swLat, neLat: bbox.neLat },
    );
  }

  async getLayers(bbox?: BBox) {
    // Zones
    const zoneQb = this.zoneRep.createQueryBuilder('z')
      .where('z.delFlag = :delFlag', { delFlag: '0' })
      .take(500);
    this.makeBboxWhere(zoneQb, 'z', 'longitude', 'latitude', bbox);

    // Stations
    const stationQb = this.stationRep.createQueryBuilder('s')
      .where('s.delFlag = :delFlag', { delFlag: '0' })
      .take(500);
    this.makeBboxWhere(stationQb, 's', 'longitude', 'latitude', bbox);

    // Devices — LEFT JOIN station for coordinates
    const deviceQb = this.deviceRep.createQueryBuilder('d')
      .leftJoinAndSelect(WaterStationEntity, 's', 's.code = d.stationCode AND s.delFlag = \'0\'')
      .where('d.delFlag = :delFlag', { delFlag: '0' })
      .take(1000);
    if (bbox) {
      deviceQb.andWhere(
        `(CAST(s.longitude AS DECIMAL(12,8)) BETWEEN :swLng AND :neLng AND CAST(s.latitude AS DECIMAL(12,8)) BETWEEN :swLat AND :neLat)
         OR (s.longitude IS NULL OR s.longitude = '')`,
        { swLng: bbox.swLng, neLng: bbox.neLng, swLat: bbox.swLat, neLat: bbox.neLat },
      );
    }

    // Alarms
    const alarmQb = this.alarmHistoryRep.createQueryBuilder('a')
      .where('a.status = :status', { status: '0' })
      .orderBy('a.alarmTime', 'DESC')
      .take(50);

    const [zones, stations, devices, alarms] = await Promise.all([
      zoneQb.getMany(),
      stationQb.getMany(),
      deviceQb.getMany(),
      alarmQb.getMany(),
    ]);

    // Map device station coordinates
    const devicesWithCoord = devices.map(d => ({
      ...d,
      longitude: (d as any)?.s?.longitude || (d as any).longitude || '',
      latitude: (d as any)?.s?.latitude || (d as any).latitude || '',
    }));

    return ResultData.ok({
      zones: { rows: zones, total: zones.length },
      stations: { rows: stations, total: stations.length },
      devices: { rows: devicesWithCoord, total: devicesWithCoord.length },
      alarms: { rows: alarms, total: alarms.length },
    });
  }

  /** Douglas-Peucker 简化算法 */
  private simplifyLine(points: number[][], tolerance: number): number[][] {
    if (points.length <= 2) return points;

    let maxDist = 0;
    let maxIdx = 0;
    const first = points[0];
    const last = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
      const dist = this.perpendicularDist(points[i], first, last);
      if (dist > maxDist) {
        maxDist = dist;
        maxIdx = i;
      }
    }

    if (maxDist > tolerance) {
      const left = this.simplifyLine(points.slice(0, maxIdx + 1), tolerance);
      const right = this.simplifyLine(points.slice(maxIdx), tolerance);
      return [...left.slice(0, -1), ...right];
    }

    return [first, last];
  }

  private perpendicularDist(point: number[], lineStart: number[], lineEnd: number[]): number {
    const dx = lineEnd[0] - lineStart[0];
    const dy = lineEnd[1] - lineStart[1];
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(point[0] - lineStart[0], point[1] - lineStart[1]);
    const t = Math.max(0, Math.min(1, ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / lenSq));
    const projX = lineStart[0] + t * dx;
    const projY = lineStart[1] + t * dy;
    return Math.hypot(point[0] - projX, point[1] - projY);
  }

  async getPipes(bbox?: BBox, zoom?: number) {
    const qb = this.pipeRep.createQueryBuilder('p')
      .where('p.delFlag = :delFlag', { delFlag: '0' });

    // Coarse spatial filter by zoneCode if bbox provided without spatial index
    if (bbox) {
      // Filter pipes whose zone's center is near the viewport
      qb.andWhere(
        `p.zoneCode IN (SELECT z.code FROM water_zone z WHERE z.delFlag = '0'
         AND CAST(z.longitude AS DECIMAL(12,8)) BETWEEN :swLng - 0.1 AND :neLng + 0.1
         AND CAST(z.latitude AS DECIMAL(12,8)) BETWEEN :swLat - 0.1 AND :neLat + 0.1)`,
        { swLng: bbox.swLng, neLng: bbox.neLng, swLat: bbox.swLat, neLat: bbox.neLat },
      );
    }

    qb.take(5000);

    const pipes = await qb.getMany();

    const parseCoord = (raw: string): number[][] => {
      try { return JSON.parse(raw); } catch { return []; }
    };

    const z = zoom || 15;

    const rows = pipes.map(p => {
      const points = parseCoord(p.coordinates || '[]');
      if (points.length === 0) return null;

      let simplified: number[][];

      if (z < 13) {
        // 城市级: 只显示 DN>=300 主管线, 坐标简化到两端点
        const dn = Number(p.diameter) || 0;
        if (dn < 300 && dn > 0) return null;
        simplified = [points[0], points[points.length - 1]];
      } else if (z < 15) {
        // 区域级: Douglas-Peucker 简化 tolerance=0.0001 (~10m)
        simplified = points.length > 2
          ? this.simplifyLine(points, 0.0001)
          : points;
      } else {
        // 街道级: 完整坐标
        simplified = points;
      }

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        pipeType: p.pipeType,
        material: p.material,
        diameter: Number(p.diameter) || 0,
        length: Number(p.length) || 0,
        zoneCode: p.zoneCode,
        coordinates: simplified,
      };
    }).filter(Boolean);

    return ResultData.ok({ rows, total: rows.length });
  }
}
