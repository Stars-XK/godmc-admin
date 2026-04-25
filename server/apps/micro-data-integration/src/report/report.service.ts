import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TdengineService } from '../tdengine/tdengine.service';
import { WaterZoneEntity } from '@app/common/entities/water-basic/water-zone.entity';
import dayjs from 'dayjs';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(WaterZoneEntity)
    private readonly zoneRep: Repository<WaterZoneEntity>,
    private readonly tdengineService: TdengineService,
  ) {}

  /**
   * 计算前一天的产销差报表（售水量自底向上聚合），可由系统定时任务调度触发
   */
  async calculateDailyNRW() {
    const targetDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    this.logger.log(`开始执行 ${targetDate} 的分区产销差售水量日聚合任务...`);
    await this.aggregateRevenueForDate(targetDate, '1d');
    this.logger.log(`完成 ${targetDate} 的分区产销差售水量日聚合。`);
  }

  /**
   * 计算上一个月的月度售水量聚合，可由系统定时任务调度触发
   */
  async calculateMonthlyNRW() {
    const targetMonth = dayjs().subtract(1, 'month').format('YYYY-MM');
    this.logger.log(`开始执行 ${targetMonth} 的分区产销差售水量月度聚合任务...`);
    await this.aggregateRevenueForDate(targetMonth, '1mo');
    this.logger.log(`完成 ${targetMonth} 的分区产销差售水量月度聚合。`);
  }

  /**
   * 核心算法：自底向上（Bottom-Up）汇总分区售水量
   * @param dateStr 目标日期(YYYY-MM-DD) 或 月份(YYYY-MM)
   * @param dataType '1d' 或 '1mo'
   */
  async aggregateRevenueForDate(dateStr: string, dataType: '1d' | '1mo') {
    const allZones = await this.zoneRep.find();
    if (allZones.length === 0) return;

    const childrenMap = new Map<number, WaterZoneEntity[]>();
    allZones.forEach(z => {
      if (!childrenMap.has(z.parentId)) childrenMap.set(z.parentId, []);
      childrenMap.get(z.parentId).push(z);
    });

    const leafZones = allZones.filter(z => !childrenMap.has(z.id) || childrenMap.get(z.id).length === 0);

    const zoneSalesMap = new Map<string, number>();
    
    let startTime = '';
    let endTime = '';
    if (dataType === '1d') {
      startTime = `${dateStr} 00:00:00`;
      endTime = `${dateStr} 23:59:59`;
    } else {
      startTime = `${dateStr}-01 00:00:00`;
      endTime = dayjs(startTime).endOf('month').format('YYYY-MM-DD 23:59:59');
    }

    const sTableName = `water_iot.revenue_meters_${dataType}`;
    
    for (const leaf of leafZones) {
      if (!leaf.code) continue;
      try {
        const sql = `SELECT SUM(val) FROM ${sTableName} WHERE zone_code = '${leaf.code}' AND ts >= '${startTime}' AND ts <= '${endTime}'`;
        const res = await this.tdengineService.querySql(sql);
        let totalSales = 0;
        if (res && res.data && res.data.length > 0 && res.data[0][0] !== null) {
          totalSales = Number(res.data[0][0].toFixed(3));
        }
        zoneSalesMap.set(leaf.code, totalSales);
      } catch (err) {
        this.logger.warn(`查询叶子分区 ${leaf.code} 的售水量失败: ${err.message}`);
        zoneSalesMap.set(leaf.code, 0);
      }
    }

    const calculateSales = (zoneId: number): number => {
      const zone = allZones.find(z => z.id === zoneId);
      if (!zone) return 0;
      
      const children = childrenMap.get(zoneId) || [];
      if (children.length === 0) {
        return zoneSalesMap.get(zone.code) || 0;
      }

      let sum = 0;
      for (const child of children) {
        sum += calculateSales(child.id);
      }
      
      if (zone.code) {
        zoneSalesMap.set(zone.code, Number(sum.toFixed(3)));
      }
      return sum;
    };

    const rootZones = allZones.filter(z => z.parentId === 0);
    for (const root of rootZones) {
      calculateSales(root.id);
    }

    const tsDate = dayjs(startTime).toDate();
    let insertCount = 0;
    
    for (const [zoneCode, val] of zoneSalesMap.entries()) {
      if (val > 0) {
        try {
          await this.tdengineService.insertZoneRevenueAggData(dataType, zoneCode, val, tsDate);
          insertCount++;
        } catch (e) {
          this.logger.error(`写入分区 ${zoneCode} 的售水量聚合结果失败:`, e);
        }
      }
    }

    this.logger.log(`成功将 ${insertCount} 个分区的售水量聚合结果(${dataType})写入底层时序库`);
  }
}
