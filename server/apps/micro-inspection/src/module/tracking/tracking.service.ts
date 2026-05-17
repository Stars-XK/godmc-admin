import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { InspectionLocationTrackEntity, InspectionTaskEntity, InspectionRouteEntity } from '@app/common';
import { InspectionGateway } from '../../gateway/inspection.gateway';

export interface LocationPoint {
  lng: number;
  lat: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  batteryLevel?: number;
  networkType?: string;
  recordedAt?: Date;
}

export interface GeofenceAlert {
  taskId: number;
  userId: number;
  userName?: string;
  point: LocationPoint;
  distance: number;
  routeName: string;
  timestamp: Date;
  consecutiveBreaches: number;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  // 连续偏离计数器: key = `${taskId}:${userId}`, value = count
  private breachCounters = new Map<string, number>();
  // 当前在线位置缓存: key = userId, value = latest position
  private livePositions = new Map<number, LocationPoint & { taskId: number; userName: string; updatedAt: Date }>();

  constructor(
    @InjectRepository(InspectionLocationTrackEntity)
    private readonly trackRep: Repository<InspectionLocationTrackEntity>,
    @InjectRepository(InspectionTaskEntity)
    private readonly taskRep: Repository<InspectionTaskEntity>,
    @InjectRepository(InspectionRouteEntity)
    private readonly routeRep: Repository<InspectionRouteEntity>,
    @Optional() private readonly gateway?: InspectionGateway,
  ) {}

  /** 单条 GPS 上报（在线场景） */
  async uploadLocation(data: any, user: any) {
    const track = await this.trackRep.save({
      taskId: data.taskId,
      userId: user.userId,
      lng: String(data.lng),
      lat: String(data.lat),
      altitude: data.altitude || null,
      speed: data.speed || 0,
      heading: data.heading || 0,
      accuracy: data.accuracy || 0,
      batteryLevel: data.batteryLevel || null,
      networkType: data.networkType || '',
      isGeofenceBreach: '0',
      recordedAt: data.recordedAt || new Date(),
      syncStatus: '0',
      createBy: user.userName,
    });

    // 更新内存缓存
    const livePos = {
      taskId: data.taskId,
      userName: user.userName,
      lng: Number(data.lng),
      lat: Number(data.lat),
      altitude: data.altitude,
      speed: data.speed,
      heading: data.heading,
      accuracy: data.accuracy,
      batteryLevel: data.batteryLevel,
      networkType: data.networkType,
      updatedAt: new Date(),
    };
    this.livePositions.set(user.userId, livePos);

    // WebSocket 实时推送位置
    this.gateway?.pushLocationUpdate({ userId: user.userId, ...livePos });

    // 电子围栏检测
    const alert = await this.checkGeofence(data.taskId, user.userId, user.userName, {
      lng: Number(data.lng),
      lat: Number(data.lat),
      recordedAt: data.recordedAt || new Date(),
    });

    return ResultData.ok({ track, geofenceAlert: alert });
  }

  /** 批量 GPS 上报（离线批量同步） */
  async batchUpload(data: any, user: any) {
    const { taskId, points } = data;
    if (!points || !Array.isArray(points) || points.length === 0) {
      return ResultData.fail(500, 'GPS数据为空');
    }

    const entities = points.map((p: any) => ({
      taskId,
      userId: user.userId,
      lng: String(p.lng),
      lat: String(p.lat),
      altitude: p.altitude || null,
      speed: p.speed || 0,
      heading: p.heading || 0,
      accuracy: p.accuracy || 0,
      batteryLevel: p.batteryLevel || null,
      networkType: p.networkType || '',
      isGeofenceBreach: '0',
      recordedAt: p.recordedAt || new Date(),
      syncStatus: '0',
      createBy: user.userName,
    }));

    await this.trackRep.save(entities);

    // 更新内存位置
    const lastPoint = points[points.length - 1];
    this.livePositions.set(user.userId, {
      taskId,
      userName: user.userName,
      lng: Number(lastPoint.lng),
      lat: Number(lastPoint.lat),
      updatedAt: new Date(),
    });

    // 对最后几个点做围栏检测
    const alerts: GeofenceAlert[] = [];
    for (const p of points.slice(-3)) {
      const alert = await this.checkGeofence(taskId, user.userId, user.userName, {
        lng: Number(p.lng),
        lat: Number(p.lat),
        recordedAt: p.recordedAt || new Date(),
      });
      if (alert) alerts.push(alert);
    }

    return ResultData.ok({ count: entities.length, alerts });
  }

  /** 查询任务轨迹 */
  async getTrail(taskId: number, query?: { start?: string; end?: string }) {
    const qb = this.trackRep.createQueryBuilder('t');
    qb.where('t.taskId = :taskId', { taskId });
    if (query?.start) qb.andWhere('t.recordedAt >= :start', { start: query.start });
    if (query?.end) qb.andWhere('t.recordedAt <= :end', { end: query.end });
    qb.orderBy('t.recordedAt', 'ASC');
    const trail = await qb.getMany();
    return ResultData.ok(trail);
  }

  /** 获取所有在线巡检员的实时位置 */
  async getLivePositions() {
    return ResultData.ok(Array.from(this.livePositions.values()));
  }

  /** 获取单个巡检员实时位置 */
  async getLivePosition(userId: number) {
    const pos = this.livePositions.get(userId);
    if (!pos) return ResultData.fail(500, '该巡检员无上报记录');
    return ResultData.ok(pos);
  }

  /** 电子围栏检测 */
  private async checkGeofence(
    taskId: number,
    userId: number,
    userName: string,
    point: LocationPoint,
  ): Promise<GeofenceAlert | null> {
    try {
      const task = await this.taskRep.findOne({ where: { id: taskId, delFlag: '0' } });
      if (!task?.routeId) return null;

      const route = await this.routeRep.findOne({ where: { id: task.routeId, delFlag: '0' } });
      if (!route?.routeGeom || !route.geofenceRadius) return null;

      const geojson = JSON.parse(route.routeGeom);
      const coords = geojson?.coordinates;
      if (!coords || !Array.isArray(coords)) return null;

      const minDist = this.pointToLineStringDistance(point.lng, point.lat, coords);
      const breach = minDist > route.geofenceRadius;

      if (breach) {
        const key = `${taskId}:${userId}`;
        const count = (this.breachCounters.get(key) || 0) + 1;
        this.breachCounters.set(key, count);

        // 标记轨迹记录
        await this.trackRep.update(
          { taskId, userId, recordedAt: point.recordedAt || new Date() },
          { isGeofenceBreach: '1' },
        );

        // 连续3次偏离才告警
        if (count >= 3) {
          this.logger.warn(`电子围栏告警: 任务${taskId} 巡检员${userName} 偏离${Math.round(minDist)}m (第${count}次)`);
          const alert: GeofenceAlert = {
            taskId,
            userId,
            userName,
            point,
            distance: Math.round(minDist),
            routeName: route.routeName,
            timestamp: new Date(),
            consecutiveBreaches: count,
          };
          this.gateway?.pushGeofenceAlert({
            taskId,
            userId,
            userName,
            lng: point.lng,
            lat: point.lat,
            distance: Math.round(minDist),
            routeName: route.routeName,
            timestamp: alert.timestamp,
            consecutiveBreaches: count,
          });
          return alert;
        }
      } else {
        // 回到围栏内，重置计数器
        this.breachCounters.delete(`${taskId}:${userId}`);
      }
    } catch (e) {
      this.logger.error(`电子围栏检测异常: ${e.message}`);
    }
    return null;
  }

  /** 点到 LineString 的最小距离（Haversine公式，单位米） */
  private pointToLineStringDistance(px: number, py: number, coords: number[][]): number {
    let minDist = Infinity;
    for (let i = 0; i < coords.length - 1; i++) {
      const [ax, ay] = coords[i];
      const [bx, by] = coords[i + 1];
      const d = this.pointToSegmentDistance(px, py, ax, ay, bx, by);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  /** 点到线段的最短球面距离 */
  private pointToSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
    // 使用平面近似（对于短距离足够精确）
    const R = 6371000; // 地球半径(米)

    // 转为弧度/平面坐标（以线段起点为原点）
    const toRad = Math.PI / 180;
    const cosLat = Math.cos(ay * toRad);

    const dx = (bx - ax) * cosLat * (R * toRad);
    const dy = (by - ay) * (R * toRad);
    const segLen2 = dx * dx + dy * dy;

    if (segLen2 === 0) {
      // 起点终点重合
      const pdx = (px - ax) * cosLat * (R * toRad);
      const pdy = (py - ay) * (R * toRad);
      return Math.sqrt(pdx * pdx + pdy * pdy);
    }

    const pdx = (px - ax) * cosLat * (R * toRad);
    const pdy = (py - ay) * (R * toRad);

    let t = (pdx * dx + pdy * dy) / segLen2;
    t = Math.max(0, Math.min(1, t));

    const nearX = t * dx;
    const nearY = t * dy;

    return Math.sqrt((pdx - nearX) * (pdx - nearX) + (pdy - nearY) * (pdy - nearY));
  }
}
