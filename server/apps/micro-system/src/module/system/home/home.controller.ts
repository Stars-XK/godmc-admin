import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import {
  WaterZoneEntity,
  WaterStationEntity,
  WaterDeviceEntity,
  WaterPointEntity,
  SysAlarmHistoryEntity,
} from '@app/common';
import dayjs from 'dayjs';

@ApiTags('首页仪表盘')
@Controller('system/home')
export class HomeController {
  constructor(
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

  @ApiOperation({ summary: '获取首页仪表盘统计数据' })
  @Get('stats')
  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const sevenDaysAgo = dayjs().subtract(6, 'day').startOf('day').toDate();

    const [
      zoneCount,
      stationCount,
      deviceCount,
      deviceOnline,
      pointCount,
      alarmCount,
      unresolvedAlarmCount,
      alarmLevelRaw,
      zoneTypeRaw,
      recentAlarms,
      alarmTrendRaw,
    ] = await Promise.all([
      this.zoneRep.count({ where: { delFlag: '0' as any } }),
      this.stationRep.count({ where: { delFlag: '0' as any } }),
      this.deviceRep.count({ where: { delFlag: '0' as any } }),
      this.deviceRep.count({ where: { delFlag: '0' as any, iotStatus: '1' as any } }),
      this.pointRep.count({ where: { delFlag: '0' as any } }),
      this.alarmHistoryRep.count({ where: { alarmTime: Between(todayStart, todayEnd) } as any }),
      this.alarmHistoryRep.count({ where: { alarmTime: Between(todayStart, todayEnd), status: '0' as any } as any }),

      // 报警级别分布 — SQL GROUP BY
      this.alarmHistoryRep
        .createQueryBuilder('a')
        .select('a.alarmLevel', 'level')
        .addSelect('COUNT(*)', 'count')
        .where('a.alarmTime >= :start', { start: todayStart })
        .andWhere('a.alarmTime <= :end', { end: todayEnd })
        .groupBy('a.alarmLevel')
        .getRawMany(),

      // 分区类型分布 — SQL GROUP BY
      this.zoneRep
        .createQueryBuilder('z')
        .select('z.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .where('z.delFlag = :df', { df: '0' })
        .groupBy('z.type')
        .getRawMany(),

      this.alarmHistoryRep.find({
        where: { alarmTime: Between(todayStart, todayEnd) } as any,
        order: { alarmTime: 'DESC' } as any,
        take: 8,
      }),

      this.alarmHistoryRep
        .createQueryBuilder('a')
        .select("DATE_FORMAT(a.alarm_time, '%Y-%m-%d')", 'date')
        .addSelect('COUNT(*)', 'count')
        .where('a.alarm_time >= :start', { start: sevenDaysAgo })
        .andWhere('a.alarm_time <= :end', { end: todayEnd })
        .groupBy("DATE_FORMAT(a.alarm_time, '%Y-%m-%d')")
        .orderBy('date', 'ASC')
        .getRawMany(),
    ]);

    // 报警级别分布 — 从 GROUP BY 结果构建
    const alarmByLevel: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 };
    alarmLevelRaw.forEach((r: any) => {
      if (alarmByLevel[r.level] !== undefined) alarmByLevel[r.level] = Number(r.count);
    });

    // 分区类型分布 — 从 GROUP BY 结果构建
    const zoneByType: Record<string, number> = {};
    zoneTypeRaw.forEach((r: any) => {
      zoneByType[r.type || '未知'] = Number(r.count);
    });

    // 报警趋势(近7天)
    const trendMap = new Map<string, number>();
    alarmTrendRaw.forEach((r: any) => trendMap.set(r.date, Number(r.count)));
    const alarmTrend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      alarmTrend.push({ date: d, count: trendMap.get(d) || 0 });
    }

    return ResultData.ok({
      zoneCount, stationCount, deviceCount, deviceOnline, pointCount,
      alarmCount, unresolvedAlarmCount,
      alarmByLevel, zoneByType, alarmTrend,
      recentAlarms: recentAlarms.map(a => ({
        alarmId: a.alarmId, ruleName: a.ruleName, alarmLevel: a.alarmLevel,
        alarmContent: a.alarmContent, alarmTime: a.alarmTime,
        alarmSource: a.alarmSource, status: a.status,
      })),
    });
  }
}
