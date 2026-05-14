import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import {
  SysReportEntity,
  WaterZoneEntity,
  WaterStationEntity,
  WaterDeviceEntity,
  WaterPointEntity,
  SysAlarmHistoryEntity,
} from '@app/common';
import dayjs from 'dayjs';

@Injectable()
export class ReportCenterService {
  private readonly logger = new Logger(ReportCenterService.name);

  constructor(
    @InjectRepository(SysReportEntity)
    private readonly reportRep: Repository<SysReportEntity>,
    @InjectRepository(WaterZoneEntity)
    private readonly zoneRep: Repository<WaterZoneEntity>,
    @InjectRepository(WaterStationEntity)
    private readonly stationRep: Repository<WaterStationEntity>,
    @InjectRepository(WaterDeviceEntity)
    private readonly deviceRep: Repository<WaterDeviceEntity>,
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
    @InjectRepository(SysAlarmHistoryEntity)
    private readonly alarmHistoryRep: Repository<SysAlarmHistoryEntity>,
  ) {}

  /** 分页查询报告列表 */
  async list(params: { pageNum: number; pageSize: number; reportType?: string; keyword?: string }) {
    const { pageNum = 1, pageSize = 10, reportType, keyword } = params;
    const where: any = { delFlag: '0' };
    if (reportType) where.reportType = reportType;
    const qb = this.reportRep.createQueryBuilder('r')
      .where('r.del_flag = :df', { df: '0' });
    if (reportType) qb.andWhere('r.report_type = :rt', { rt: reportType });
    if (keyword) qb.andWhere('(r.title LIKE :kw OR r.tags LIKE :kw)', { kw: `%${keyword}%` });
    qb.orderBy('r.create_time', 'DESC').skip((pageNum - 1) * pageSize).take(pageSize);
    const [rows, total] = await qb.getManyAndCount();
    return { rows, total };
  }

  /** 获取单个报告详情 */
  async getById(reportId: number) {
    const report = await this.reportRep.findOne({ where: { reportId, delFlag: '0' } });
    if (report) {
      report.viewCount += 1;
      await this.reportRep.save(report);
    }
    return report;
  }

  /** 删除报告(软删除) */
  async delete(reportId: number) {
    await this.reportRep.update(reportId, { delFlag: '1' } as any);
  }

  /** 生成专题报告 */
  async generate(reportType: string, reportPeriod: string, title?: string) {
    const now = dayjs();
    let content: any = { sections: [] };
    let summary = '';

    switch (reportType) {
      case 'monthly_ops':
        content = await this.generateMonthlyOps(reportPeriod);
        summary = `${reportPeriod} 供水运行月报`;
        break;
      case 'device_ops':
        content = await this.generateDeviceOps();
        summary = '设备运行状态报告';
        break;
      case 'alarm_analysis':
        content = await this.generateAlarmAnalysis(reportPeriod);
        summary = `${reportPeriod} 报警分析报告`;
        break;
      case 'zone_water':
        content = await this.generateZoneWater(reportPeriod);
        summary = `${reportPeriod} 分区水量报告`;
        break;
      default:
        content = { sections: [{ type: 'text', title: '自定义报告', content: '请编辑报告内容' }] };
        summary = '自定义报告';
    }

    const entity = this.reportRep.create({
      title: title || `${summary} - ${now.format('YYYY-MM-DD HH:mm')}`,
      reportType,
      reportPeriod,
      reportStatus: 'published',
      summary,
      content: JSON.stringify(content),
      tags: reportType,
      generateTime: new Date(),
      viewCount: 0,
    });
    return this.reportRep.save(entity);
  }

  /** 更新报告内容 */
  async update(reportId: number, dto: { title?: string; summary?: string; content?: string; tags?: string; reportStatus?: string }) {
    await this.reportRep.update(reportId, dto as any);
    return this.reportRep.findOne({ where: { reportId } });
  }

  // ---- 报告生成逻辑 ----

  private async generateMonthlyOps(period: string) {
    const startStr = `${period}-01 00:00:00`;
    const endStr = dayjs(startStr).endOf('month').format('YYYY-MM-DD 23:59:59');
    const startDate = dayjs(startStr).toDate();
    const endDate = dayjs(endStr).toDate();

    const [zoneCount, stationCount, deviceCount, pointCount, deviceOnline, alarmCount, pointTypeRaw] = await Promise.all([
      this.zoneRep.count({ where: { delFlag: '0' } }),
      this.stationRep.count({ where: { delFlag: '0' } }),
      this.deviceRep.count({ where: { delFlag: '0' } }),
      this.pointRep.count({ where: { delFlag: '0' } }),
      this.deviceRep.count({ where: { delFlag: '0', iotStatus: '1' as any } }),
      this.alarmHistoryRep.count({ where: { alarmTime: Between(startDate, endDate) } as any }),
      this.pointRep
        .createQueryBuilder('p')
        .select('p.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .where('p.delFlag = :df', { df: '0' })
        .groupBy('p.type')
        .getRawMany(),
    ]);

    const alarmByLevel = await this.countAlarmByLevel(startDate, endDate);

    const typeCategoryLabels: Record<string, { category: string; label: string }> = {
      '1': { category: '流量', label: '流量' }, '2': { category: '流量', label: '累计流量' },
      '3': { category: '流量', label: '瞬时流量' }, '4': { category: '流量', label: '进水流量' },
      '5': { category: '流量', label: '出水流量' }, '6': { category: '流量', label: '原水流量' },
      '7': { category: '流量', label: '清水流量' },
      '8': { category: '压力', label: '压力' }, '9': { category: '压力', label: '进水压力' },
      '10': { category: '压力', label: '出水压力' }, '11': { category: '压力', label: '管网压力' },
      '12': { category: '压力', label: '泵站压力' },
      '13': { category: '液位', label: '液位' }, '14': { category: '液位', label: '水库液位' },
      '15': { category: '液位', label: '水池液位' }, '16': { category: '液位', label: '水井液位' },
      '17': { category: '水质', label: '余氯' }, '34': { category: '水质', label: '进水余氯' },
      '35': { category: '水质', label: '出水余氯' }, '18': { category: '水质', label: '浊度' },
      '36': { category: '水质', label: '进水浊度' }, '37': { category: '水质', label: '出水浊度' },
      '19': { category: '水质', label: 'pH值' }, '38': { category: '水质', label: '进水pH' },
      '39': { category: '水质', label: '出水pH' }, '20': { category: '水质', label: '高锰酸盐' },
      '41': { category: '水质', label: '进水高锰酸盐' }, '42': { category: '水质', label: '出水高锰酸盐' },
      '21': { category: '水质', label: '氨氮' }, '43': { category: '水质', label: '进水氨氮' },
      '44': { category: '水质', label: '出水氨氮' }, '22': { category: '水质', label: '溶解氧' },
      '45': { category: '水质', label: '进水溶解氧' }, '46': { category: '水质', label: '出水溶解氧' },
      '23': { category: '水质', label: '温度' }, '47': { category: '水质', label: '进水温度' },
      '48': { category: '水质', label: '出水温度' },
      '28': { category: '电力', label: '电量' }, '29': { category: '电力', label: '功率' },
      '30': { category: '电力', label: '电流' }, '31': { category: '电力', label: '电压' },
      '24': { category: '状态', label: '设备状态' }, '25': { category: '状态', label: '阀门状态' },
      '26': { category: '状态', label: '水泵状态' }, '27': { category: '状态', label: '风机状态' },
      '32': { category: '其他', label: '频率' }, '40': { category: '其他', label: '转速' },
      '33': { category: '其他', label: '时间' },
    };

    const categoryAgg: Record<string, number> = {};
    for (const r of pointTypeRaw) {
      const cat = typeCategoryLabels[r.type]?.category || '其他';
      categoryAgg[cat] = (categoryAgg[cat] || 0) + Number(r.count);
    }
    const pointCategoryRows = Object.entries(categoryAgg)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => [cat, String(count), pointCount > 0 ? ((count / pointCount) * 100).toFixed(1) + '%' : '0%']);

    const sections = [
      { type: 'text', title: '概述', content: `${period} 供水运行月报。本报告覆盖 ${zoneCount} 个管理分区、${stationCount} 座站点设施、${deviceCount} 台设备（在线 ${deviceOnline} 台）、${pointCount} 个监测点位。` },
      { type: 'grid', title: '关键指标', items: [
        { label: '管理分区', value: zoneCount, unit: '个' },
        { label: '站点设施', value: stationCount, unit: '座' },
        { label: '在线设备', value: deviceOnline, unit: `/${deviceCount}台` },
        { label: '监测点位', value: pointCount, unit: '个' },
        { label: '月报警总数', value: alarmCount, unit: '条' },
      ]},
      { type: 'grid', title: '报警级别分布', items: [
        { label: '紧急', value: alarmByLevel['1'], unit: '条', color: '#DC2626' },
        { label: '重要', value: alarmByLevel['2'], unit: '条', color: '#F59E0B' },
        { label: '次要', value: alarmByLevel['3'], unit: '条', color: '#3B82F6' },
        { label: '提示', value: alarmByLevel['4'], unit: '条', color: '#94A3B8' },
      ]},
      { type: 'table', title: '测点类型分布', headers: ['分类', '数量', '占比'], rows: pointCategoryRows },
    ];

    return { sections, generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') };
  }

  private async generateDeviceOps() {
    const [total, online, offline] = await Promise.all([
      this.deviceRep.count({ where: { delFlag: '0' } }),
      this.deviceRep.count({ where: { delFlag: '0', iotStatus: '1' as any } }),
      this.deviceRep.count({ where: { delFlag: '0', iotStatus: '0' as any } }),
    ]);

    const onlineRate = total > 0 ? ((online / total) * 100).toFixed(1) : '0';

    return {
      sections: [
        { type: 'text', title: '概述', content: `当前设备总数为 ${total} 台，在线 ${online} 台，离线 ${offline} 台，在线率 ${onlineRate}%。` },
        { type: 'grid', title: '设备状态总览', items: [
          { label: '设备总数', value: total, unit: '台' },
          { label: '在线设备', value: online, unit: '台', color: '#10B981' },
          { label: '离线设备', value: offline, unit: '台', color: '#EF4444' },
          { label: '在线率', value: onlineRate, unit: '%', color: total > 0 ? '#10B981' : '#94A3B8' },
        ]},
      ],
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
  }

  private async generateAlarmAnalysis(period: string) {
    const startStr = `${period}-01 00:00:00`;
    const endStr = dayjs(startStr).endOf('month').format('YYYY-MM-DD 23:59:59');
    const startDate = dayjs(startStr).toDate();
    const endDate = dayjs(endStr).toDate();

    const [total, unresolved, resolved] = await Promise.all([
      this.alarmHistoryRep.count({ where: { alarmTime: Between(startDate, endDate) } as any }),
      this.alarmHistoryRep.count({ where: { alarmTime: Between(startDate, endDate), status: '0' as any } as any }),
      this.alarmHistoryRep.count({ where: { alarmTime: Between(startDate, endDate), status: '1' as any } as any }),
    ]);

    const byLevel = await this.countAlarmByLevel(startDate, endDate);

    const handleRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : '0';

    return {
      sections: [
        { type: 'text', title: '概述', content: `${period} 共产生报警 ${total} 条，已处理 ${resolved} 条，未处理 ${unresolved} 条，处理率 ${handleRate}%。` },
        { type: 'grid', title: '报警总览', items: [
          { label: '报警总数', value: total, unit: '条' },
          { label: '已处理', value: resolved, unit: '条', color: '#10B981' },
          { label: '未处理', value: unresolved, unit: '条', color: '#EF4444' },
          { label: '处理率', value: handleRate, unit: '%' },
        ]},
        { type: 'grid', title: '级别分布', items: [
          { label: '紧急', value: byLevel['1'], unit: '条', color: '#DC2626' },
          { label: '重要', value: byLevel['2'], unit: '条', color: '#F59E0B' },
          { label: '次要', value: byLevel['3'], unit: '条', color: '#3B82F6' },
          { label: '提示', value: byLevel['4'], unit: '条', color: '#94A3B8' },
        ]},
      ],
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
  }

  private async countAlarmByLevel(startDate: Date, endDate: Date) {
    const rows = await this.alarmHistoryRep
      .createQueryBuilder('a')
      .select('a.alarmLevel', 'level')
      .addSelect('COUNT(*)', 'count')
      .where('a.alarmTime >= :start', { start: startDate })
      .andWhere('a.alarmTime <= :end', { end: endDate })
      .groupBy('a.alarmLevel')
      .getRawMany();
    const result: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 };
    rows.forEach((r: any) => {
      if (result[r.level] !== undefined) result[r.level] = Number(r.count);
    });
    return result;
  }

  private async generateZoneWater(period: string) {
    const zones = await this.zoneRep.find({ where: { delFlag: '0' }, take: 20 });
    const zoneByType: Record<string, number> = {};
    zones.forEach(z => {
      const t = z.type || '未知';
      zoneByType[t] = (zoneByType[t] || 0) + 1;
    });

    const typeLabel = (t: string) => ({ '1': '行政营业', '2': 'DMA漏损', '3': '控压高程', '4': '供水调度' }[t] || `类型${t}`);

    return {
      sections: [
        { type: 'text', title: '概述', content: `${period} 分区水量报告。当前系统共有 ${zones.length} 个管理分区。` },
        { type: 'table', title: '分区类型分布', headers: ['分区类型', '数量'], rows: Object.entries(zoneByType).map(([k, v]) => [typeLabel(k), String(v)]) },
      ],
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
  }
}
