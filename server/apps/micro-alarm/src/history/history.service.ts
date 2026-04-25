import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysAlarmHistoryEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';
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

    qb.orderBy('history.alarmTime', 'DESC');

    const pageNum = query.pageNum ? parseInt(query.pageNum, 10) : 1;
    const pageSize = query.pageSize ? parseInt(query.pageSize, 10) : 10;
    
    qb.skip((pageNum - 1) * pageSize);
    qb.take(pageSize);

    const [rows, total] = await qb.getManyAndCount();
    
    return {
      code: 200,
      rows,
      total,
      msg: '操作成功',
    };
  }

  async resolve(resolveDto: ResolveHistoryDto, user: string) {
    const history = await this.historyRepository.findOne({ where: { alarmId: resolveDto.alarmId } });
    if (!history) {
      return ResultData.fail(500, `Alarm history with ID ${resolveDto.alarmId} not found`);
    }
    if (history.status === '1') {
      return ResultData.fail(500, `Alarm history with ID ${resolveDto.alarmId} is already resolved`);
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
}
