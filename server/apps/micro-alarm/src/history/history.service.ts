import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { SysAlarmHistoryEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';
import { ExportTable } from '@app/common/utils/export';
import { ResolveHistoryDto } from './dto/history.dto';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(SysAlarmHistoryEntity)
    private readonly historyRepository: Repository<SysAlarmHistoryEntity>,
  ) {}

  async findAll(query: any) {
    const qb = this.historyRepository.createQueryBuilder('history');

    if (query.ruleName) {
      qb.andWhere('history.ruleName LIKE :ruleName', { ruleName: `%${query.ruleName}%` });
    }
    if (query.alarmLevel) {
      qb.andWhere('history.alarmLevel = :alarmLevel', { alarmLevel: query.alarmLevel });
    }
    if (query.status) {
      qb.andWhere('history.status = :status', { status: query.status });
    }
    if (query.startTime) {
      qb.andWhere('history.alarmTime >= :startTime', { startTime: query.startTime });
    }
    if (query.endTime) {
      qb.andWhere('history.alarmTime <= :endTime', { endTime: query.endTime });
    }
    if (query.alarmSource) {
      qb.andWhere('history.alarmSource = :alarmSource', { alarmSource: query.alarmSource });
    }

    qb.orderBy('history.alarmTime', 'DESC');

    const pageNum = query.pageNum ? parseInt(query.pageNum, 10) : 1;
    const pageSize = query.pageSize ? parseInt(query.pageSize, 10) : 10;

    qb.skip((pageNum - 1) * pageSize);
    qb.take(pageSize);

    const [rows, total] = await qb.getManyAndCount();

    return ResultData.ok({ rows, total });
  }

  async findOne(id: number) {
    const history = await this.historyRepository.findOne({ where: { alarmId: id } });
    if (!history) {
      return ResultData.fail(404, `报警记录 #${id} 不存在`);
    }
    return ResultData.ok(history);
  }

  async resolve(resolveDto: ResolveHistoryDto, user: string) {
    const history = await this.historyRepository.findOne({ where: { alarmId: resolveDto.alarmId } });
    if (!history) {
      return ResultData.fail(404, `报警记录 #${resolveDto.alarmId} 不存在`);
    }
    if (history.status === '1') {
      return ResultData.fail(409, `报警记录 #${resolveDto.alarmId} 已处理`);
    }

    const updated = this.historyRepository.merge(history, {
      status: '1',
      resolveBy: user,
      resolveTime: new Date(),
      resolveRemark: resolveDto.resolveRemark,
    });

    await this.historyRepository.save(updated);
    return ResultData.ok();
  }

  /**
   * 获取报警统计数据
   */
  async statistics(query: any) {
    const qb = this.historyRepository.createQueryBuilder('history');

    if (query.startTime) {
      qb.andWhere('history.alarmTime >= :startTime', { startTime: query.startTime });
    }
    if (query.endTime) {
      qb.andWhere('history.alarmTime <= :endTime', { endTime: query.endTime });
    }

    // 按报警级别统计
    const levelStats = await this.historyRepository
      .createQueryBuilder('history')
      .select('history.alarmLevel', 'level')
      .addSelect('COUNT(*)', 'count')
      .where(qb.expressionMap.wheres?.length > 0 ? '1=1' : '1=1')
      .groupBy('history.alarmLevel')
      .getRawMany();

    // 按状态统计
    const statusStats = await this.historyRepository
      .createQueryBuilder('history')
      .select('history.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('history.status')
      .getRawMany();

    // 总数统计
    const totalQuery = this.historyRepository.createQueryBuilder('history');
    if (query.startTime) totalQuery.andWhere('history.alarmTime >= :startTime', { startTime: query.startTime });
    if (query.endTime) totalQuery.andWhere('history.alarmTime <= :endTime', { endTime: query.endTime });
    const totalCount = await totalQuery.getCount();

    return ResultData.ok({
      totalCount,
      byLevel: levelStats,
      byStatus: statusStats,
    });
  }

  /**
   * 导出报警历史数据
   */
  async export(res: any, query: any) {
    const qb = this.historyRepository.createQueryBuilder('history');

    if (query.ruleName) {
      qb.andWhere('history.ruleName LIKE :ruleName', { ruleName: `%${query.ruleName}%` });
    }
    if (query.alarmLevel) {
      qb.andWhere('history.alarmLevel = :alarmLevel', { alarmLevel: query.alarmLevel });
    }
    if (query.status) {
      qb.andWhere('history.status = :status', { status: query.status });
    }
    if (query.startTime) {
      qb.andWhere('history.alarmTime >= :startTime', { startTime: query.startTime });
    }
    if (query.endTime) {
      qb.andWhere('history.alarmTime <= :endTime', { endTime: query.endTime });
    }

    qb.orderBy('history.alarmTime', 'DESC');

    const data = await qb.getMany();

    const header = [
      { title: '报警ID', dataIndex: 'alarmId', width: 10 },
      { title: '规则名称', dataIndex: 'ruleName', width: 25 },
      { title: '报警级别', dataIndex: 'alarmLevel', width: 10 },
      { title: '报警内容', dataIndex: 'alarmContent', width: 40 },
      { title: '报警来源', dataIndex: 'alarmSource', width: 20 },
      { title: '报警时间', dataIndex: 'alarmTime', width: 20 },
      { title: '处理状态', dataIndex: 'status', width: 10 },
      { title: '处理人', dataIndex: 'resolveBy', width: 15 },
      { title: '处理时间', dataIndex: 'resolveTime', width: 20 },
      { title: '处理备注', dataIndex: 'resolveRemark', width: 30 },
    ];

    return ExportTable({
      data,
      header,
      sheetName: '报警历史记录',
      dictMap: {
        alarmLevel: 'alarm_level',
        status: 'alarm_history_status',
      }
    }, res);
  }
}
