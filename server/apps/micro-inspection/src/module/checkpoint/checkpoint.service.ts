import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { InspectionCheckpointEntity, InspectionCheckItemEntity } from '@app/common';

@Injectable()
export class CheckpointService {
  constructor(
    @InjectRepository(InspectionCheckpointEntity)
    private readonly checkpointRep: Repository<InspectionCheckpointEntity>,
    @InjectRepository(InspectionCheckItemEntity)
    private readonly checkItemRep: Repository<InspectionCheckItemEntity>,
  ) {}

  // ================= 检查点 CRUD =================

  async create(createDto: any, user: any) {
    createDto.createBy = user.userName;
    const checkpoint = await this.checkpointRep.save(createDto);
    return ResultData.ok(checkpoint);
  }

  async findList(query: any) {
    const pageNum = Number(query.pageNum) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const qb = this.checkpointRep.createQueryBuilder('cp');
    qb.where('cp.delFlag = :delFlag', { delFlag: '0' });

    if (query.checkpointType) qb.andWhere('cp.checkpointType = :checkpointType', { checkpointType: query.checkpointType });
    if (query.checkpointName) qb.andWhere('cp.checkpointName LIKE :checkpointName', { checkpointName: `%${query.checkpointName}%` });
    if (query.refType) qb.andWhere('cp.refType = :refType', { refType: query.refType });
    if (query.deptId) qb.andWhere('cp.deptId = :deptId', { deptId: query.deptId });

    qb.orderBy('cp.sortOrder', 'ASC').addOrderBy('cp.createTime', 'DESC');

    const [list, total] = await qb.skip((pageNum - 1) * pageSize).take(pageSize).getManyAndCount();

    return ResultData.ok({ list, total });
  }

  async findOne(id: number) {
    const checkpoint = await this.checkpointRep.findOne({ where: { id, delFlag: '0' } });
    if (!checkpoint) {
      return ResultData.fail(500, '检查点不存在');
    }
    const items = await this.checkItemRep.find({
      where: { checkpointId: id, delFlag: '0' },
      order: { sortOrder: 'ASC' },
    });
    return ResultData.ok({ ...checkpoint, items });
  }

  async update(updateDto: any, user: any) {
    updateDto.updateBy = user.userName;
    await this.checkpointRep.update(updateDto.id, updateDto);
    return ResultData.ok();
  }

  async remove(id: number) {
    await this.checkpointRep.update(id, { delFlag: '1' });
    // 级联删除检查项
    await this.checkItemRep.update({ checkpointId: id }, { delFlag: '1' });
    return ResultData.ok();
  }

  // ================= 检查项 CRUD =================

  async createItem(createDto: any, user: any) {
    createDto.createBy = user.userName;
    const item = await this.checkItemRep.save(createDto);

    // 更新检查点的检查项计数
    const count = await this.checkItemRep.count({
      where: { checkpointId: createDto.checkpointId, delFlag: '0' },
    });
    await this.checkpointRep.update(createDto.checkpointId, { checkItemCount: count });

    return ResultData.ok(item);
  }

  async findItemList(checkpointId: number) {
    const items = await this.checkItemRep.find({
      where: { checkpointId, delFlag: '0' },
      order: { sortOrder: 'ASC' },
    });
    return ResultData.ok(items);
  }

  async updateItem(updateDto: any, user: any) {
    updateDto.updateBy = user.userName;
    await this.checkItemRep.update(updateDto.id, updateDto);
    return ResultData.ok();
  }

  async removeItem(id: number) {
    const item = await this.checkItemRep.findOne({ where: { id, delFlag: '0' } });
    if (!item) {
      return ResultData.fail(500, '检查项不存在');
    }
    await this.checkItemRep.update(id, { delFlag: '1' });

    // 更新检查点的检查项计数
    const count = await this.checkItemRep.count({
      where: { checkpointId: item.checkpointId, delFlag: '0' },
    });
    await this.checkpointRep.update(item.checkpointId, { checkItemCount: count });

    return ResultData.ok();
  }
}
