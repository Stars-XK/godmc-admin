import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { InspectionPhotoEntity } from '@app/common';

@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(InspectionPhotoEntity)
    private readonly photoRep: Repository<InspectionPhotoEntity>,
  ) {}

  async findList(query: any) {
    const pageNum = Number(query.pageNum) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const qb = this.photoRep.createQueryBuilder('p');
    qb.where('p.delFlag = :delFlag', { delFlag: '0' });
    if (query.taskId) qb.andWhere('p.taskId = :taskId', { taskId: query.taskId });
    if (query.recordId) qb.andWhere('p.recordId = :recordId', { recordId: query.recordId });
    qb.orderBy('p.sortOrder', 'ASC');
    const [list, total] = await qb.skip((pageNum - 1) * pageSize).take(pageSize).getManyAndCount();
    return ResultData.ok({ list, total });
  }
}
