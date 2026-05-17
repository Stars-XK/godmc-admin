import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { InspectionTaskEntity } from '@app/common';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(InspectionTaskEntity)
    private readonly taskRep: Repository<InspectionTaskEntity>,
  ) {}

  async create(createDto: any, user: any) {
    createDto.createBy = user.userName;
    await this.taskRep.save(createDto);
    return ResultData.ok();
  }

  async findList(query: any) {
    const pageNum = Number(query.pageNum) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const qb = this.taskRep.createQueryBuilder('t');
    qb.where('t.delFlag = :delFlag', { delFlag: '0' });

    if (query.taskStatus) qb.andWhere('t.taskStatus = :taskStatus', { taskStatus: query.taskStatus });
    if (query.assignedUserId) qb.andWhere('t.assignedUserId = :assignedUserId', { assignedUserId: query.assignedUserId });
    if (query.planId) qb.andWhere('t.planId = :planId', { planId: query.planId });
    if (query.taskName) qb.andWhere('t.taskName LIKE :taskName', { taskName: `%${query.taskName}%` });

    qb.orderBy('t.createTime', 'DESC');

    const [list, total] = await qb.skip((pageNum - 1) * pageSize).take(pageSize).getManyAndCount();

    return ResultData.ok({ list, total });
  }

  async findOne(id: number) {
    const task = await this.taskRep.findOne({ where: { id, delFlag: '0' } });
    if (!task) {
      return ResultData.fail(500, '巡检任务不存在');
    }
    return ResultData.ok(task);
  }

  async update(updateDto: any, user: any) {
    updateDto.updateBy = user.userName;
    await this.taskRep.update(updateDto.id, updateDto);
    return ResultData.ok();
  }

  async remove(id: number) {
    await this.taskRep.update(id, { delFlag: '1' });
    return ResultData.ok();
  }
}
