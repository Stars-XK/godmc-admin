import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TdengineService } from '../tdengine/tdengine.service';
import { WaterZoneEntity } from '@app/common/entities/water-basic/water-zone.entity';
import { ResultData } from '@app/common/utils/result';
import { ListToTree } from '@app/common/utils';
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

  /**
   * 查询分区的产销差（NRW）趋势数据
   */
  async getNrwTrend(zoneCode: string, startDate: string, endDate: string, type: '1d' | '1mo') {
    const supplySql = `
      SELECT ts, total_val
      FROM water_iot.zone_meters_${type}
      WHERE metric_type = 'water_supply'
        AND ts >= '${startDate} 00:00:00'
        AND ts <= '${endDate} 23:59:59'
        AND zone_code = '${zoneCode}'
      ORDER BY ts ASC
    `;

    const salesSql = `
      SELECT ts, total_val
      FROM water_iot.zone_revenue_${type}
      WHERE metric_type = 'water_sales'
        AND ts >= '${startDate} 00:00:00'
        AND ts <= '${endDate} 23:59:59'
        AND zone_code = '${zoneCode}'
      ORDER BY ts ASC
    `;

    try {
      const [supplyRes, salesRes] = await Promise.all([
        this.tdengineService.querySql(supplySql),
        this.tdengineService.querySql(salesSql)
      ]);

      const supplyMap = new Map<string, number>();
      if (supplyRes && (supplyRes as any).data) {
        (supplyRes as any).data.forEach(row => {
          const tsStr = dayjs(row[0]).format(type === '1d' ? 'YYYY-MM-DD' : 'YYYY-MM');
          supplyMap.set(tsStr, row[1]);
        });
      }

      const salesMap = new Map<string, number>();
      if (salesRes && (salesRes as any).data) {
        (salesRes as any).data.forEach(row => {
          const tsStr = dayjs(row[0]).format(type === '1d' ? 'YYYY-MM-DD' : 'YYYY-MM');
          salesMap.set(tsStr, row[1]);
        });
      }

      const result = [];
      const periods = dayjs(endDate).diff(dayjs(startDate), type === '1d' ? 'day' : 'month') + 1;

      for (let i = 0; i < periods; i++) {
        const d = dayjs(startDate).add(i, type === '1d' ? 'day' : 'month');
        const tsStr = d.format(type === '1d' ? 'YYYY-MM-DD' : 'YYYY-MM');

        const supply = supplyMap.get(tsStr) || 0;
        const sales = salesMap.get(tsStr) || 0;
        const diff = Number((supply - sales).toFixed(3));
        const ratio = supply > 0 ? Number(((diff / supply) * 100).toFixed(2)) : 0;

        result.push({
          date: tsStr,
          supply,
          sales,
          nrw_diff: diff,
          nrw_ratio: ratio
        });
      }

      return ResultData.ok(result);
    } catch (e) {
      this.logger.error('查询产销差报表失败', e);
      return ResultData.fail(500, e.message);
    }
  }

  /**
   * 一次性返回完整分区树 + 每个节点的产销差数据（替代前端的 N+1 递归调用）
   * @param dateStr 目标日期(YYYY-MM-DD) 或 月份(YYYY-MM)
   * @param dataType '1d' 或 '1mo'
   */
  async getTreeSummary(dateStr: string, dataType: '1d' | '1mo') {
    // 1. 获取分区树
    const allZones = await this.zoneRep.find({ where: { delFlag: '0' as any } });
    if (allZones.length === 0) return ResultData.ok([]);

    // 2. 确定时间范围
    let startTime: string;
    let endTime: string;
    if (dataType === '1d') {
      startTime = `${dateStr} 00:00:00`;
      endTime = `${dateStr} 23:59:59`;
    } else {
      startTime = `${dateStr}-01 00:00:00`;
      endTime = dayjs(startTime).endOf('month').format('YYYY-MM-DD 23:59:59');
    }

    // 3. 批量查询所有分区的供水和售水数据
    const zoneCodes = allZones.filter(z => z.code).map(z => z.code);
    const supplyMap = new Map<string, number>();
    const salesMap = new Map<string, number>();

    // TDengine 的 IN 子句
    const codeList = zoneCodes.map(c => `'${c}'`).join(',');
    const supplySql = `SELECT zone_code, SUM(total_val) FROM water_iot.zone_meters_${dataType} WHERE metric_type = 'water_supply' AND ts >= '${startTime}' AND ts <= '${endTime}' AND zone_code IN (${codeList}) GROUP BY zone_code`;
    const salesSql = `SELECT zone_code, SUM(total_val) FROM water_iot.zone_revenue_${dataType} WHERE metric_type = 'water_sales' AND ts >= '${startTime}' AND ts <= '${endTime}' AND zone_code IN (${codeList}) GROUP BY zone_code`;

    try {
      const [supplyRes, salesRes] = await Promise.all([
        this.tdengineService.querySql(supplySql),
        this.tdengineService.querySql(salesSql),
      ]);

      if (supplyRes?.data) {
        supplyRes.data.forEach((row: any) => {
          const code = String(row[0]);
          supplyMap.set(code, Number(Number(row[1] || 0).toFixed(3)));
        });
      }
      if (salesRes?.data) {
        salesRes.data.forEach((row: any) => {
          const code = String(row[0]);
          salesMap.set(code, Number(Number(row[1] || 0).toFixed(3)));
        });
      }
    } catch (e) {
      this.logger.warn(`批量查询产销差数据失败: ${e.message}，supply/sales 将为 0`);
    }

    // 4. 递归计算每个节点的产销差数据
    const childrenMap = new Map<number, WaterZoneEntity[]>();
    allZones.forEach(z => {
      if (!childrenMap.has(z.parentId)) childrenMap.set(z.parentId, []);
      childrenMap.get(z.parentId)!.push(z);
    });

    const nrwCache = new Map<string, { supply: number; sales: number; nrwDiff: number; nrwRatio: number }>();

    const calcNode = (zone: WaterZoneEntity): { supply: number; sales: number } => {
      const children = childrenMap.get(zone.id) || [];
      if (children.length === 0) {
        const supply = supplyMap.get(zone.code) || 0;
        const sales = salesMap.get(zone.code) || 0;
        const nrwDiff = Number((supply - sales).toFixed(3));
        const nrwRatio = supply > 0 ? Number(((nrwDiff / supply) * 100).toFixed(2)) : 0;
        nrwCache.set(zone.code, { supply, sales, nrwDiff, nrwRatio });
        return { supply, sales };
      }

      let totalSupply = 0;
      let totalSales = 0;
      for (const child of children) {
        const childResult = calcNode(child);
        totalSupply += childResult.supply;
        totalSales += childResult.sales;
      }

      // 如果父分区自身有直接挂载的供水/售水数据（可能在聚合表中直接有），优先用聚合表数据
      const directSupply = supplyMap.get(zone.code);
      const directSales = salesMap.get(zone.code);
      const supply = directSupply !== undefined ? directSupply : Number(totalSupply.toFixed(3));
      const sales = directSales !== undefined ? directSales : Number(totalSales.toFixed(3));
      const nrwDiff = Number((supply - sales).toFixed(3));
      const nrwRatio = supply > 0 ? Number(((nrwDiff / supply) * 100).toFixed(2)) : 0;
      nrwCache.set(zone.code, { supply, sales, nrwDiff, nrwRatio });
      return { supply, sales };
    };

    // 计算所有根节点
    const rootZones = allZones.filter(z => z.parentId === 0);
    for (const root of rootZones) {
      calcNode(root);
    }

    // 也计算非根但孤立的分区（兜底）
    for (const z of allZones) {
      if (!nrwCache.has(z.code) && z.code) {
        const supply = supplyMap.get(z.code) || 0;
        const sales = salesMap.get(z.code) || 0;
        const nrwDiff = Number((supply - sales).toFixed(3));
        const nrwRatio = supply > 0 ? Number(((nrwDiff / supply) * 100).toFixed(2)) : 0;
        nrwCache.set(z.code, { supply, sales, nrwDiff, nrwRatio });
      }
    }

    // 5. 构建树并将 NRW 数据挂载到每个节点
    const tree = ListToTree(allZones, m => String(m.id), m => String(m.parentId));

    const attachNrw = (nodes: any[]) => {
      for (const node of nodes) {
        const data = nrwCache.get(node.code);
        if (data) {
          node.supply = data.supply;
          node.sales = data.sales;
          node.nrwDiff = data.nrwDiff;
          node.nrwRatio = data.nrwRatio;
        } else {
          node.supply = 0;
          node.sales = 0;
          node.nrwDiff = 0;
          node.nrwRatio = 0;
        }
        node.childCount = node.children?.length || 0;
        node.hasChildren = node.childCount > 0;
        if (node.children?.length > 0) {
          attachNrw(node.children);
        }
      }
    };
    attachNrw(tree);

    return ResultData.ok(tree);
  }
}
