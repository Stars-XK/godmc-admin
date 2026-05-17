import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { InspectionIssueEntity } from '@app/common';

@Injectable()
export class IssueService {
  constructor(
    @InjectRepository(InspectionIssueEntity)
    private readonly issueRep: Repository<InspectionIssueEntity>,
  ) {}

  async findList(query: any) {
    const pageNum = Number(query.pageNum) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const qb = this.issueRep.createQueryBuilder('i');
    qb.where('i.delFlag = :delFlag', { delFlag: '0' });
    if (query.issueStatus) qb.andWhere('i.issueStatus = :issueStatus', { issueStatus: query.issueStatus });
    if (query.severity) qb.andWhere('i.severity = :severity', { severity: query.severity });
    qb.orderBy('i.createTime', 'DESC');
    const [list, total] = await qb.skip((pageNum - 1) * pageSize).take(pageSize).getManyAndCount();
    return ResultData.ok({ list, total });
  }
}
