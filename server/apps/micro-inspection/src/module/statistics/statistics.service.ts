import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import {
  InspectionStatisticsEntity,
  InspectionTaskEntity,
  InspectionRecordEntity,
  InspectionIssueEntity,
} from '@app/common';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(InspectionStatisticsEntity)
    private readonly statsRep: Repository<InspectionStatisticsEntity>,
    @InjectRepository(InspectionTaskEntity)
    private readonly taskRep: Repository<InspectionTaskEntity>,
    @InjectRepository(InspectionRecordEntity)
    private readonly recordRep: Repository<InspectionRecordEntity>,
    @InjectRepository(InspectionIssueEntity)
    private readonly issueRep: Repository<InspectionIssueEntity>,
  ) {}

  /** 仪表盘核心 KPI */
  async getDashboard(query: any) {
    const period = query.statPeriod || 'day';

    const [taskStats, issueStats, completionStats] = await Promise.all([
      this.getTaskStats(),
      this.getIssueStats(),
      this.getCompletionRate(),
    ]);

    // 最近30天趋势
    const trend = await this.getDailyTrend(30);

    // 检查员排行榜
    const ranking = await this.getInspectorRanking(10);

    // 缓存表数据（预聚合统计）
    const cached = await this.statsRep.find({
      where: { statType: 'overall' },
      order: { statDate: 'DESC' },
      take: 30,
    });

    return ResultData.ok({
      period,
      taskStats,
      issueStats,
      completionStats,
      trend,
      ranking,
      cached,
    });
  }

  /** 任务统计概览 */
  private async getTaskStats() {
    const qb = this.taskRep.createQueryBuilder('t').where('t.delFlag = :df', { df: '0' });
    const total = await qb.getCount();
    const completed = await qb.andWhere('t.taskStatus = :s', { s: 'closed' }).getCount();
    const inProgress = await this.taskRep
      .createQueryBuilder('t')
      .where('t.delFlag = :df', { df: '0' })
      .andWhere('t.taskStatus IN (:...sts)', { sts: ['accepted', 'in_progress'] })
      .getCount();
    const overdue = await this.taskRep
      .createQueryBuilder('t')
      .where('t.delFlag = :df', { df: '0' })
      .andWhere('t.taskStatus = :s', { s: 'overdue' })
      .getCount();
    const pending = await this.taskRep
      .createQueryBuilder('t')
      .where('t.delFlag = :df', { df: '0' })
      .andWhere('t.taskStatus = :s', { s: 'pending' })
      .getCount();

    return { total, completed, inProgress: inProgress + completed, overdue, pending };
  }

  /** 问题统计概览 */
  private async getIssueStats() {
    const qb = this.issueRep.createQueryBuilder('i').where('i.delFlag = :df', { df: '0' });
    const total = await qb.getCount();
    const critical = await qb.andWhere('i.severity = :s', { s: '1' }).getCount();
    const resolved = await this.issueRep
      .createQueryBuilder('i')
      .where('i.delFlag = :df', { df: '0' })
      .andWhere('i.issueStatus IN (:...sts)', { sts: ['resolved', 'closed', 'verified'] })
      .getCount();
    const open = await this.issueRep
      .createQueryBuilder('i')
      .where('i.delFlag = :df', { df: '0' })
      .andWhere('i.issueStatus = :s', { s: 'open' })
      .getCount();

    return { total, critical, resolved, open };
  }

  /** 完成率 */
  private async getCompletionRate() {
    const total = await this.taskRep.createQueryBuilder('t').where('t.delFlag = :df', { df: '0' }).getCount();
    const completed = await this.taskRep
      .createQueryBuilder('t')
      .where('t.delFlag = :df', { df: '0' })
      .andWhere('t.taskStatus = :s', { s: 'closed' })
      .getCount();
    const rate = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;

    const result = await this.taskRep
      .createQueryBuilder('t')
      .select('AVG(TIMESTAMPDIFF(MINUTE, t.actualStartTime, t.actualEndTime))', 'avgMin')
      .where('t.delFlag = :df', { df: '0' })
      .andWhere('t.actualStartTime IS NOT NULL')
      .andWhere('t.actualEndTime IS NOT NULL')
      .getRawOne();
    const avgCompletionMin = Math.round(Number(result?.avgMin) || 0);

    return { rate, total, completed, avgCompletionMin };
  }

  /** 日趋势（最近N天） */
  async getDailyTrend(days: number = 30) {
    const tasksCompleted = await this.taskRep
      .createQueryBuilder('t')
      .select("DATE_FORMAT(t.actualEndTime, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('t.delFlag = :df', { df: '0' })
      .andWhere('t.taskStatus = :s', { s: 'closed' })
      .andWhere('t.actualEndTime >= DATE_SUB(NOW(), INTERVAL :days DAY)', { days })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    const issuesCreated = await this.issueRep
      .createQueryBuilder('i')
      .select("DATE_FORMAT(i.createTime, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('i.delFlag = :df', { df: '0' })
      .andWhere('i.createTime >= DATE_SUB(NOW(), INTERVAL :days DAY)', { days })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return { tasksCompleted, issuesCreated };
  }

  /** 检查员排行榜 */
  async getInspectorRanking(limit: number = 10) {
    return this.taskRep
      .createQueryBuilder('t')
      .select('t.assignedUserName', 'name')
      .addSelect('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN t.taskStatus = 'closed' THEN 1 ELSE 0 END)", 'completed')
      .addSelect("SUM(CASE WHEN t.taskStatus = 'overdue' THEN 1 ELSE 0 END)", 'overdue')
      .where('t.delFlag = :df', { df: '0' })
      .groupBy('t.assignedUserName')
      .orderBy('completed', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  /** 合规率详情 */
  async getCompliance(query: any) {
    const pageNum = Number(query.pageNum) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const qb = this.taskRep
      .createQueryBuilder('t')
      .where('t.delFlag = :df', { df: '0' });
    const total = await qb.getCount();
    const list = await qb
      .orderBy('t.createTime', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getMany();
    return ResultData.ok({ list, total });
  }

  /** 问题趋势 */
  async getIssueTrend(query: any) {
    const days = Number(query.days) || 30;
    const raw = await this.issueRep
      .createQueryBuilder('i')
      .select("DATE_FORMAT(i.createTime, '%Y-%m-%d')", 'date')
      .addSelect('i.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .where('i.delFlag = :df', { df: '0' })
      .andWhere('i.createTime >= DATE_SUB(NOW(), INTERVAL :days DAY)', { days })
      .groupBy('date, i.severity')
      .orderBy('date', 'ASC')
      .getRawMany();
    return ResultData.ok(raw);
  }
}
