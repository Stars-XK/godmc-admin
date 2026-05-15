import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterEnergyEntity, WaterStationEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';
import dayjs from 'dayjs';

@Injectable()
export class EnergyService {
  constructor(
    @InjectRepository(WaterEnergyEntity)
    private readonly energyRep: Repository<WaterEnergyEntity>,
    @InjectRepository(WaterStationEntity)
    private readonly stationRep: Repository<WaterStationEntity>,
  ) {}

  async list(params: any) {
    const { pageNum = 1, pageSize = 10, stationCode, periodType } = params;
    const qb = this.energyRep.createQueryBuilder('e')
      .where('e.delFlag = :df', { df: '0' });
    if (stationCode) qb.andWhere('e.stationCode = :sc', { sc: stationCode });
    if (periodType) qb.andWhere('e.periodType = :pt', { pt: periodType });
    qb.orderBy('e.recordTime', 'DESC').skip((pageNum - 1) * pageSize).take(pageSize);
    const [rows, total] = await qb.getManyAndCount();
    return ResultData.ok({ rows, total });
  }

  async getSummary(period?: string) {
    const targetPeriod = period || dayjs().format('YYYY-MM');

    // 单条 SQL：按站点聚合能耗 + 全局汇总
    const stationAgg = await this.energyRep
      .createQueryBuilder('e')
      .select('e.stationCode', 'stationCode')
      .addSelect('SUM(e.powerConsumption)', 'totalPower')
      .addSelect('SUM(e.waterOutput)', 'totalWater')
      .addSelect('COUNT(*)', 'days')
      .where('e.recordPeriod = :period', { period: targetPeriod })
      .andWhere('e.periodType = :pt', { pt: '1d' })
      .andWhere('e.delFlag = :df', { df: '0' })
      .groupBy('e.stationCode')
      .getRawMany();

    // 计算全局汇总
    let totalPower = 0, totalWater = 0, totalDays = 0;
    for (const r of stationAgg) {
      totalPower += Number(r.totalPower);
      totalWater += Number(r.totalWater);
      totalDays += Number(r.days);
    }
    const avgUnit = totalWater > 0 ? (totalPower / totalWater).toFixed(4) : '0';

    // 获取站点名称映射（只查有能耗数据的站点）
    const stationCodes = stationAgg.map(r => r.stationCode);
    let stationNameMap = new Map<string, string>();
    if (stationCodes.length > 0) {
      const stations = await this.stationRep
        .createQueryBuilder('s')
        .select(['s.code', 's.name'])
        .where('s.code IN (:...codes)', { codes: stationCodes })
        .andWhere('s.delFlag = :df', { df: '0' })
        .getMany();
      stations.forEach(s => stationNameMap.set(s.code, s.name));
    }

    const details = stationAgg.map(r => {
      const p = Number(r.totalPower), w = Number(r.totalWater);
      return {
        stationCode: r.stationCode,
        stationName: stationNameMap.get(r.stationCode) || r.stationCode,
        totalPower: p.toFixed(2),
        totalWater: w.toFixed(2),
        unitConsumption: w > 0 ? (p / w).toFixed(4) : '0',
        days: Number(r.days),
      };
    }).filter(d => Number(d.totalPower) > 0);

    return ResultData.ok({
      period: targetPeriod,
      totalPower: totalPower.toFixed(2),
      totalWater: totalWater.toFixed(2),
      avgUnitConsumption: avgUnit,
      stationCount: details.length,
      recordCount: totalDays,
      details,
    });
  }

  async create(body: any) {
    const powerConsumption = Number(body.powerConsumption) || 0;
    const waterOutput = Number(body.waterOutput) || 0;
    // 服务端自动计算单位能耗，防止客户端传入错误值
    const unitConsumption = waterOutput > 0 ? powerConsumption / waterOutput : 0;
    const entity = this.energyRep.create({
      ...body,
      powerConsumption,
      waterOutput,
      unitConsumption,
      recordTime: new Date(),
    });
    return this.energyRep.save(entity);
  }

  async delete(recordId: number) {
    await this.energyRep.update(recordId, { delFlag: '1' });
  }
}
