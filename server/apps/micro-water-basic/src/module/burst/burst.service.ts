import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ResultData } from '@app/common/utils/result';
import {
  WaterZoneEntity,
  WaterPipeEntity,
  WaterDeviceEntity,
  WaterPointEntity,
  WaterBurstEventEntity,
} from '@app/common';
import { BurstAreaService } from './burst-area.service';
import { EventsGateway } from '../../gateway/events.gateway';

@Injectable()
export class BurstService {
  private readonly logger = new Logger(BurstService.name);
  private readonly dataIntegrationUrl = 'http://localhost:3007/data-integration';

  constructor(
    @InjectRepository(WaterZoneEntity)
    private readonly zoneRep: Repository<WaterZoneEntity>,
    @InjectRepository(WaterPipeEntity)
    private readonly pipeRep: Repository<WaterPipeEntity>,
    @InjectRepository(WaterDeviceEntity)
    private readonly deviceRep: Repository<WaterDeviceEntity>,
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
    @InjectRepository(WaterBurstEventEntity)
    private readonly burstEventRep: Repository<WaterBurstEventEntity>,
    private readonly httpService: HttpService,
    private readonly burstAreaService: BurstAreaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // ============ 核心分析入口 ============

  async analyzeZone(zoneCode: string): Promise<ResultData> {
    const zone = await this.zoneRep.findOne({ where: { code: zoneCode, delFlag: '0' } });
    if (!zone) return ResultData.fail(500, `分区 ${zoneCode} 不存在`);

    const results: any[] = [];

    // 算法1: 流量突变检测
    try {
      const flowResult = await this.detectFlowAnomaly(zoneCode);
      if (flowResult) results.push(...flowResult);
    } catch (e) {
      this.logger.warn(`流量突变检测失败 (${zoneCode}): ${e.message}`);
    }

    // 算法2: 压降检测
    try {
      const pressureResult = await this.detectPressureAnomaly(zoneCode);
      if (pressureResult) results.push(...pressureResult);
    } catch (e) {
      this.logger.warn(`压降检测失败 (${zoneCode}): ${e.message}`);
    }

    // 算法3: 产销差分析
    try {
      const supplyDiffResult = await this.analyzeSupplyDiff(zoneCode);
      if (supplyDiffResult) results.push(...supplyDiffResult);
    } catch (e) {
      this.logger.warn(`产销差分析失败 (${zoneCode}): ${e.message}`);
    }

    // 综合判定
    const merged = this.mergeAndRank(results, zoneCode);

    // 保存事件
    const savedEvents = [];
    for (const item of merged) {
      const event = await this.saveBurstEvent(zoneCode, item);
      savedEvents.push(event);

      // 计算影响面
      if (event.confidence >= 50) {
        await this.burstAreaService.calculateAffectedArea(event.id, zoneCode, item.pipeCode);
      }

      // WebSocket 实时推送爆管事件
      this.eventsGateway.pushBurstEvent({
        eventId: event.id,
        zoneCode: event.zoneCode,
        pipeCode: event.pipeCode,
        burstType: event.burstType,
        confidence: event.confidence,
        severity: event.severity,
        description: event.description,
        anomalyTime: event.anomalyTime,
      });
    }

    return ResultData.ok({
      zoneCode,
      totalEvents: savedEvents.length,
      highRiskCount: savedEvents.filter(e => e.confidence >= 70).length,
      events: savedEvents,
    });
  }

  async analyzeAllZones(): Promise<ResultData> {
    const zones = await this.zoneRep.find({
      where: { delFlag: '0' },
      select: ['code', 'name'],
    });
    const allResults: any[] = [];
    for (const z of zones) {
      try {
        const res = await this.analyzeZone(z.code);
        if (res.data?.events) {
          allResults.push({ zoneCode: z.code, zoneName: z.name, ...res.data });
        }
      } catch (e) {
        this.logger.warn(`分区 ${z.code} 分析失败: ${e.message}`);
      }
    }
    return ResultData.ok({
      analyzedZones: allResults.length,
      totalEvents: allResults.reduce((s, r) => s + (r.totalEvents || 0), 0),
      zoneResults: allResults,
    });
  }

  // ============ 算法1: 流量突变检测 ============

  private async detectFlowAnomaly(zoneCode: string): Promise<any[]> {
    // 获取该分区下所有设备的流量测点
    const devices = await this.deviceRep.find({
      where: { zoneCode, delFlag: '0' },
      select: ['code'],
    });
    if (devices.length === 0) return [];
    const deviceCodes = devices.map(d => d.code);

    const flowPoints = await this.pointRep.find({
      where: { deviceCode: In(deviceCodes), type: In(['1', '3', '4', '5']), delFlag: '0' },
      select: ['code', 'deviceCode', 'name', 'type'],
    });
    if (flowPoints.length === 0) return [];

    const results: any[] = [];

    for (const point of flowPoints) {
      try {
        const now = new Date();
        const endTime = this.formatTime(now);
        const startTime = this.formatTime(new Date(now.getTime() - 75 * 60000));

        const res = await this.httpService.axiosRef.get(
          `${this.dataIntegrationUrl}/query/aggregated`,
          { params: { deviceCode: point.deviceCode, pointCode: point.code, startTime, endTime, interval: '5m', pointType: 'instantaneous' } }
        );
        const data: { ts: string; val: number; max: number; min: number }[] = res.data?.data || [];
        if (data.length < 12) continue;

        // 最近3个点(15min) vs 前9个点(45min)
        const recent = data.slice(-3);
        const baseline = data.slice(-12, -3);
        const recentAvg = recent.reduce((s, d) => s + d.val, 0) / recent.length;
        const baselineAvg = baseline.reduce((s, d) => s + d.val, 0) / baseline.length;
        if (baselineAvg === 0) continue;

        const changePct = ((recentAvg - baselineAvg) / baselineAvg) * 100;

        // 进水流量(type=4)突增或出水流量(type=5)突降 → 可能爆管
        const isInflow = point.type === '4' || point.name?.includes('进水');
        const isOutflow = point.type === '5' || point.name?.includes('出水');

        if ((isInflow && changePct > 20) || (isOutflow && changePct < -30)) {
          const pipe = await this.findSuspiciousPipe(zoneCode);
          const confidence = this.calcFlowConfidence(Math.abs(changePct), pipe);
          results.push({
            pipeCode: pipe?.code || null,
            burstType: 'FLOW_DROP',
            confidence,
            severity: confidence >= 70 ? 3 : confidence >= 50 ? 2 : 1,
            flowBefore: baselineAvg,
            flowAfter: recentAvg,
            anomalyTime: now,
            description: `${point.name}流量异常: 基线${baselineAvg.toFixed(1)} → 当前${recentAvg.toFixed(1)} (${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%)`,
            pointCode: point.code,
          });
        }
      } catch (e) {
        this.logger.debug(`流量检测跳过测点 ${point.code}: ${e.message}`);
      }
    }

    return results;
  }

  // ============ 算法2: 压降检测 ============

  private async detectPressureAnomaly(zoneCode: string): Promise<any[]> {
    const devices = await this.deviceRep.find({
      where: { zoneCode, delFlag: '0' },
      select: ['code'],
    });
    if (devices.length === 0) return [];
    const deviceCodes = devices.map(d => d.code);

    const pressurePoints = await this.pointRep.find({
      where: { deviceCode: In(deviceCodes), type: In(['8', '9', '10', '11', '12']), delFlag: '0' },
      select: ['code', 'deviceCode', 'name', 'type'],
    });
    if (pressurePoints.length === 0) return [];

    const results: any[] = [];
    const anomalyPoints: any[] = [];

    for (const point of pressurePoints) {
      try {
        const now = new Date();
        const endTime = this.formatTime(now);
        const startTime = this.formatTime(new Date(now.getTime() - 120 * 60000));

        const res = await this.httpService.axiosRef.get(
          `${this.dataIntegrationUrl}/query/aggregated`,
          { params: { deviceCode: point.deviceCode, pointCode: point.code, startTime, endTime, interval: '5m', pointType: 'instantaneous' } }
        );
        const data: { ts: string; val: number; max: number; min: number }[] = res.data?.data || [];
        if (data.length < 6) continue;

        const recent = data.slice(-2);
        const baseline = data.slice(-12, -2);
        const recentAvg = recent.reduce((s, d) => s + d.val, 0) / recent.length;
        const baselineAvg = baseline.reduce((s, d) => s + d.val, 0) / baseline.length;
        if (baselineAvg === 0) continue;

        const dropPct = ((baselineAvg - recentAvg) / baselineAvg) * 100;
        if (dropPct > 25) {
          anomalyPoints.push({ pointCode: point.code, dropPct, recentAvg, baselineAvg, pointName: point.name });
        }
      } catch (e) {
        this.logger.debug(`压力检测跳过测点 ${point.code}: ${e.message}`);
      }
    }

    // 空间聚类：2+ 个相邻压力点同时异常 → 提高置信度
    if (anomalyPoints.length >= 2) {
      const pipe = await this.findSuspiciousPipe(zoneCode);
      const maxDrop = Math.max(...anomalyPoints.map(p => p.dropPct));
      const confidence = Math.min(95, Math.round(maxDrop * 1.5 + (anomalyPoints.length - 1) * 10));
      const pointNames = anomalyPoints.map(p => p.pointName).join(', ');
      results.push({
        pipeCode: pipe?.code || null,
        burstType: 'PRESSURE_DROP',
        confidence,
        severity: confidence >= 70 ? 3 : 2,
        pressureBefore: anomalyPoints[0].baselineAvg,
        pressureAfter: anomalyPoints[0].recentAvg,
        anomalyTime: new Date(),
        description: `${anomalyPoints.length}个压力点同时异常(${pointNames}): 降幅最大${maxDrop.toFixed(1)}%`,
        anomalyPointCount: anomalyPoints.length,
      });
    } else if (anomalyPoints.length === 1) {
      const p = anomalyPoints[0];
      results.push({
        pipeCode: null,
        burstType: 'PRESSURE_DROP',
        confidence: Math.min(70, Math.round(p.dropPct * 1.2)),
        severity: 2,
        pressureBefore: p.baselineAvg,
        pressureAfter: p.recentAvg,
        anomalyTime: new Date(),
        description: `${p.pointName}压力突降${p.dropPct.toFixed(1)}%: ${p.baselineAvg.toFixed(3)} → ${p.recentAvg.toFixed(3)} MPa`,
      });
    }

    return results;
  }

  // ============ 算法3: 产销差分析 ============

  private async analyzeSupplyDiff(zoneCode: string): Promise<any[]> {
    try {
      const res = await this.httpService.axiosRef.get(
        `${this.dataIntegrationUrl}/query/zone-supply-diff`,
        { params: { zoneCode, hours: 24 } }
      );
      const diffData = res.data?.data;
      if (!diffData || diffData.totalInflow === 0) return [];

      const { totalInflow, totalOutflow } = diffData;

      const diffAbs = totalInflow - totalOutflow;
      const diffRate = (diffAbs / totalInflow) * 100;

      // 差率 >40% 且绝对值 >50m³/h (每小时)
      const hourlyDiff = diffAbs / 24;

      if (diffRate > 40 && hourlyDiff > 50) {
        const pipe = await this.findSuspiciousPipe(zoneCode);
        const confidence = Math.min(90, Math.round(diffRate * 1.2));
        return [{
          pipeCode: pipe?.code || null,
          burstType: 'SUPPLY_DIFF',
          confidence,
          severity: confidence >= 70 ? 3 : 2,
          flowBefore: totalInflow,
          flowAfter: totalOutflow,
          anomalyTime: new Date(),
          description: `产销差率${diffRate.toFixed(1)}% (进水${totalInflow.toFixed(1)}m³, 出水${totalOutflow.toFixed(1)}m³, 差值${diffAbs.toFixed(1)}m³/24h)`,
        }];
      }
    } catch (e) {
      this.logger.warn(`产销差分析失败 (${zoneCode}): ${e.message}`);
    }
    return [];
  }

  // ============ 辅助方法 ============

  private async findSuspiciousPipe(zoneCode: string): Promise<{ code: string; name: string; diameter: number; material: string; coordinates: string } | null> {
    const pipes = await this.pipeRep.find({
      where: { zoneCode, delFlag: '0' },
      order: { installDate: 'ASC' }, // 老旧管道优先
      take: 5,
    });
    if (pipes.length === 0) return null;

    // 加权评分：管龄大 + 管径大 + 材质脆弱 → 得分高
    const scored = pipes.map(p => {
      const age = p.installDate ? new Date().getFullYear() - new Date(p.installDate).getFullYear() : 5;
      const materialScore = ['PE', 'PVC'].includes(p.material) ? 1 : p.material === '铸铁' ? 2 : 0.5;
      const diameterScore = p.diameter ? p.diameter / 500 : 0.5;
      const score = age * 2 + materialScore * 10 + diameterScore * 5;
      return { pipe: p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].pipe;
  }

  private calcFlowConfidence(changePct: number, pipe: any): number {
    let base = Math.min(80, changePct * 1.5);
    if (pipe) {
      const age = pipe.installDate ? new Date().getFullYear() - new Date(pipe.installDate).getFullYear() : 0;
      base += Math.min(15, age * 0.5);
      if (['PE', 'PVC'].includes(pipe.material)) base += 5;
    }
    return Math.min(95, Math.round(base));
  }

  private mergeAndRank(results: any[], zoneCode: string): any[] {
    // 按管线聚合
    const grouped = new Map<string, any>();
    for (const r of results) {
      const key = r.pipeCode || '__unknown__';
      if (!grouped.has(key)) {
        grouped.set(key, r);
      } else {
        const exist = grouped.get(key);
        exist.confidence = Math.max(exist.confidence, r.confidence);
        exist.severity = Math.max(exist.severity, r.severity);
        exist.description += '; ' + r.description;
        if (!exist.burstTypes) exist.burstTypes = [exist.burstType];
        exist.burstTypes.push(r.burstType);
      }
    }
    return [...grouped.values()].sort((a, b) => b.confidence - a.confidence);
  }

  private async saveBurstEvent(zoneCode: string, item: any): Promise<WaterBurstEventEntity> {
    const event = new WaterBurstEventEntity();
    event.zoneCode = zoneCode;
    event.pipeCode = item.pipeCode;
    event.burstType = item.burstTypes ? item.burstTypes.join(',') : item.burstType;
    event.confidence = item.confidence;
    event.severity = item.severity;
    event.flowBefore = item.flowBefore;
    event.flowAfter = item.flowAfter;
    event.pressureBefore = item.pressureBefore;
    event.pressureAfter = item.pressureAfter;
    event.anomalyTime = item.anomalyTime;
    event.description = item.description;
    return this.burstEventRep.save(event);
  }

  // ============ 查询接口 ============

  async getEvents(query: any) {
    const { zoneCode, status, pageNum = 1, pageSize = 20 } = query;
    const qb = this.burstEventRep.createQueryBuilder('e').where('e.delFlag = :df', { df: '0' });
    if (zoneCode) qb.andWhere('e.zoneCode = :zc', { zc: zoneCode });
    if (status) qb.andWhere('e.status = :st', { st: status });
    qb.orderBy('e.anomalyTime', 'DESC');
    const [list, total] = await qb
      .skip((Math.max(pageNum, 1) - 1) * Math.min(pageSize, 100))
      .take(Math.min(pageSize, 100))
      .getManyAndCount();
    return ResultData.ok({ list, total });
  }

  async getEventDetail(id: number) {
    const event = await this.burstEventRep.findOne({ where: { id, delFlag: '0' } });
    if (!event) return ResultData.fail(500, '事件不存在');
    return ResultData.ok(event);
  }

  async updateEventStatus(id: number, status: string) {
    await this.burstEventRep.update(id, { status });
    return ResultData.ok();
  }

  async getRiskZones() {
    const events = await this.burstEventRep
      .createQueryBuilder('e')
      .select('e.zoneCode, MAX(e.confidence) as maxConfidence, COUNT(*) as eventCount')
      .where('e.delFlag = :df', { df: '0' })
      .andWhere("e.status IN ('0','1')")
      .groupBy('e.zoneCode')
      .orderBy('maxConfidence', 'DESC')
      .getRawMany();

    const zones = await this.zoneRep.find({ where: { delFlag: '0' }, select: ['code', 'name', 'longitude', 'latitude', 'boundary'] });
    const zoneMap = new Map(zones.map(z => [z.code, z]));
    const result = events.map(e => ({
      zoneCode: e.zoneCode,
      zoneName: zoneMap.get(e.zoneCode)?.name || e.zoneCode,
      longitude: zoneMap.get(e.zoneCode)?.longitude || '',
      latitude: zoneMap.get(e.zoneCode)?.latitude || '',
      boundary: zoneMap.get(e.zoneCode)?.boundary || null,
      maxConfidence: Number(e.maxConfidence),
      eventCount: Number(e.eventCount),
      riskLevel: Number(e.maxConfidence) >= 70 ? 'high' : Number(e.maxConfidence) >= 50 ? 'medium' : 'low',
    }));

    // 补充没有事件的分区
    for (const z of zones) {
      if (!result.find(r => r.zoneCode === z.code)) {
        result.push({ zoneCode: z.code, zoneName: z.name, longitude: z.longitude, latitude: z.latitude, boundary: z.boundary, maxConfidence: 0, eventCount: 0, riskLevel: 'low' });
      }
    }
    return ResultData.ok(result);
  }

  async getHistoryByZone(zoneCode: string) {
    const events = await this.burstEventRep.find({
      where: { zoneCode, delFlag: '0' },
      order: { anomalyTime: 'DESC' },
      take: 50,
    });
    return ResultData.ok(events);
  }

  private formatTime(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
}
