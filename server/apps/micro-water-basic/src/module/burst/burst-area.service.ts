import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  WaterBurstEventEntity,
  WaterBurstAreaEntity,
  WaterPipeEntity,
  WaterDeviceEntity,
  WaterStationEntity,
} from '@app/common';

@Injectable()
export class BurstAreaService {
  private readonly logger = new Logger(BurstAreaService.name);

  constructor(
    @InjectRepository(WaterBurstAreaEntity)
    private readonly burstAreaRep: Repository<WaterBurstAreaEntity>,
    @InjectRepository(WaterBurstEventEntity)
    private readonly burstEventRep: Repository<WaterBurstEventEntity>,
    @InjectRepository(WaterPipeEntity)
    private readonly pipeRep: Repository<WaterPipeEntity>,
    @InjectRepository(WaterDeviceEntity)
    private readonly deviceRep: Repository<WaterDeviceEntity>,
    @InjectRepository(WaterStationEntity)
    private readonly stationRep: Repository<WaterStationEntity>,
  ) {}

  async calculateAffectedArea(eventId: number, zoneCode: string, pipeCode?: string): Promise<void> {
    try {
      const event = await this.burstEventRep.findOne({ where: { id: eventId } });
      if (!event) return;

      // 1. 获取管线坐标
      let pipeCoords: number[][] = [];
      if (pipeCode) {
        const pipe = await this.pipeRep.findOne({ where: { code: pipeCode, delFlag: '0' } });
        if (pipe?.coordinates) {
          try {
            pipeCoords = JSON.parse(pipe.coordinates);
          } catch { pipeCoords = []; }
        }
      }

      // 如果没有具体管段，收集分区内所有管线求包围盒
      if (pipeCoords.length === 0) {
        const allPipes = await this.pipeRep.find({ where: { zoneCode, delFlag: '0' } });
        const allCoords: number[][] = [];
        for (const p of allPipes) {
          if (p.coordinates) {
            try {
              const c = JSON.parse(p.coordinates);
              allCoords.push(...(Array.isArray(c[0]) ? c : [c]));
            } catch {}
          }
        }
        pipeCoords = allCoords;
      }

      // 2. 计算影响面 (圆形缓冲区 + 分区裁剪)
      const bufferMeters = pipeCode
        ? (await this.getPipeDiameter(pipeCode)) / 1000 * 200 // 管径越大 buffer 越宽
        : 500;

      const center = this.computeCenter(pipeCoords);
      const radius = this.computeBoundingRadius(pipeCoords, center) + bufferMeters;

      // 生成圆形 GeoJSON
      const areaGeojson = JSON.stringify(this.createCircleGeoJSON(center, radius));

      // 3. 统计影响面内设施
      const affectedPipeCount = await this.pipeRep.count({ where: { zoneCode, delFlag: '0' } });
      const affectedDeviceCount = await this.deviceRep.count({ where: { zoneCode, delFlag: '0' } });

      // 4. 预估水损失 (基于置信度和严重等级)
      const estimatedLoss = event.confidence / 100 * (event.severity || 1) * 50;

      // 5. 保存影响面
      let area = await this.burstAreaRep.findOne({ where: { burstEventId: eventId } });
      if (!area) {
        area = new WaterBurstAreaEntity();
        area.burstEventId = eventId;
      }
      area.zoneCode = zoneCode;
      area.pipeCode = pipeCode || null;
      area.areaGeojson = areaGeojson;
      area.areaSize = Math.PI * radius * radius;
      area.affectedPipeCount = affectedPipeCount;
      area.affectedDeviceCount = affectedDeviceCount;
      area.estimatedWaterLoss = Math.round(estimatedLoss * 100) / 100;
      await this.burstAreaRep.save(area);

      // 6. 更新事件的影响面 GeoJSON
      event.affectedAreaGeojson = areaGeojson;
      event.affectedPipes = JSON.stringify({ count: affectedPipeCount });
      event.affectedUsers = Math.round(affectedDeviceCount * 50); // 粗略估计
      await this.burstEventRep.save(event);
    } catch (e) {
      this.logger.error(`影响面计算失败 (event ${eventId}): ${e.message}`);
    }
  }

  async getAffectedArea(eventId: number) {
    const area = await this.burstAreaRep.findOne({ where: { burstEventId: eventId } });
    return area;
  }

  // ============ 几何辅助 ============

  private computeCenter(coords: number[][]): [number, number] {
    if (coords.length === 0) return [118.6, 24.9];
    const sum = coords.reduce((s, c) => [s[0] + c[0], s[1] + c[1]], [0, 0]);
    return [sum[0] / coords.length, sum[1] / coords.length];
  }

  private computeBoundingRadius(coords: number[][], center: [number, number]): number {
    let maxDist = 200; // 最小半径 200m
    for (const c of coords) {
      const d = this.haversineMeters(center, [c[0], c[1]]);
      if (d > maxDist) maxDist = d;
    }
    return Math.min(maxDist, 5000); // 上限 5km
  }

  private haversineMeters(a: [number, number], b: [number, number]): number {
    const R = 6371000;
    const dLat = (b[1] - a[1]) * Math.PI / 180;
    const dLon = (b[0] - a[0]) * Math.PI / 180;
    const lat1 = a[1] * Math.PI / 180;
    const lat2 = b[1] * Math.PI / 180;
    const aa = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  }

  private createCircleGeoJSON(center: [number, number], radiusMeters: number): any {
    const points: number[][] = [];
    const n = 64;
    const latPerMeter = 1 / 111320;
    const lngPerMeter = 1 / (111320 * Math.cos(center[1] * Math.PI / 180));
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n;
      points.push([
        center[0] + radiusMeters * Math.cos(angle) * lngPerMeter,
        center[1] + radiusMeters * Math.sin(angle) * latPerMeter,
      ]);
    }
    points.push(points[0]); // close ring
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [points] },
      properties: { radiusMeters, center },
    };
  }

  private async getPipeDiameter(pipeCode: string): Promise<number> {
    const pipe = await this.pipeRep.findOne({ where: { code: pipeCode, delFlag: '0' }, select: ['diameter'] });
    return pipe?.diameter || 200;
  }
}
