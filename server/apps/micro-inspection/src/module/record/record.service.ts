import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { InspectionRecordEntity, InspectionTaskEntity } from '@app/common';

@Injectable()
export class RecordService {
  constructor(
    @InjectRepository(InspectionRecordEntity)
    private readonly recordRep: Repository<InspectionRecordEntity>,
    @InjectRepository(InspectionTaskEntity)
    private readonly taskRep: Repository<InspectionTaskEntity>,
  ) {}

  /**
   * 统计任务下已完成的不重复检查点数量
   */
  private async countDistinctCheckpoints(taskId: number): Promise<number> {
    const result = await this.recordRep
      .createQueryBuilder('r')
      .select('COUNT(DISTINCT r.checkpointId)', 'cnt')
      .where('r.taskId = :taskId', { taskId })
      .andWhere('r.delFlag = :delFlag', { delFlag: '0' })
      .getRawOne();
    return Number(result?.cnt) || 0;
  }

  /**
   * 更新任务完成进度
   */
  private async updateTaskProgress(taskId: number, totalCheckpoints: number, extra: Partial<InspectionTaskEntity> = {}) {
    const completedCount = await this.countDistinctCheckpoints(taskId);
    const ratio = totalCheckpoints > 0 ? Math.min(100, Math.round((completedCount / totalCheckpoints) * 100)) : 0;
    await this.taskRep.update(taskId, {
      completionRatio: ratio,
      completedCheckpoints: completedCount,
      ...extra,
    });
  }

  async submit(submitDto: any, user: any) {
    const task = await this.taskRep.findOne({ where: { id: submitDto.taskId, delFlag: '0' } });
    if (!task) {
      return ResultData.fail(500, '巡检任务不存在');
    }
    if (!['accepted', 'in_progress'].includes(task.taskStatus)) {
      return ResultData.fail(500, '当前任务状态不可提交巡检记录');
    }

    if (task.taskStatus === 'accepted') {
      await this.taskRep.update(task.id, {
        taskStatus: 'in_progress',
        actualStartTime: new Date(),
      });
    }

    submitDto.createBy = user.userName;
    submitDto.submitUserId = user.userId;
    submitDto.submittedAt = new Date();
    submitDto.syncStatus = '0';

    const record = await this.recordRep.save(submitDto);
    await this.updateTaskProgress(task.id, task.totalCheckpoints);

    return ResultData.ok(record);
  }

  async batchSubmit(batchDto: any, user: any) {
    const { taskId, records } = batchDto;
    const task = await this.taskRep.findOne({ where: { id: taskId, delFlag: '0' } });
    if (!task) {
      return ResultData.fail(500, '巡检任务不存在');
    }

    const savedRecords = [];
    for (const record of records) {
      record.taskId = taskId;
      record.createBy = user.userName;
      record.submitUserId = user.userId;
      record.submittedAt = new Date();
      record.syncStatus = '0';
      const saved = await this.recordRep.save(record);
      savedRecords.push(saved);
    }

    await this.updateTaskProgress(taskId, task.totalCheckpoints, {
      taskStatus: 'in_progress',
      actualStartTime: task.actualStartTime || new Date(),
    });

    return ResultData.ok(savedRecords);
  }

  async findList(query: any) {
    const pageNum = Number(query.pageNum) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const qb = this.recordRep.createQueryBuilder('r');
    qb.where('r.delFlag = :delFlag', { delFlag: '0' });

    if (query.taskId) qb.andWhere('r.taskId = :taskId', { taskId: query.taskId });
    if (query.checkpointId) qb.andWhere('r.checkpointId = :checkpointId', { checkpointId: query.checkpointId });
    if (query.checkResult) qb.andWhere('r.checkResult = :checkResult', { checkResult: query.checkResult });

    qb.orderBy('r.submittedAt', 'DESC');

    const [list, total] = await qb.skip((pageNum - 1) * pageSize).take(pageSize).getManyAndCount();

    return ResultData.ok({ list, total });
  }

  async findByTaskId(taskId: number) {
    const records = await this.recordRep.find({
      where: { taskId, delFlag: '0' },
      order: { submittedAt: 'DESC' },
    });
    return ResultData.ok(records);
  }
}
