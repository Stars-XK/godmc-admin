import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { InspectionPlanEntity, InspectionRouteEntity } from '@app/common';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(InspectionPlanEntity)
    private readonly planRep: Repository<InspectionPlanEntity>,
    @InjectRepository(InspectionRouteEntity)
    private readonly routeRep: Repository<InspectionRouteEntity>,
  ) {}

  async create(createDto: any, user: any) {
    createDto.createBy = user.userName;
    await this.planRep.save(createDto);
    return ResultData.ok();
  }

  async findList(query: any) {
    const pageNum = Number(query.pageNum) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const qb = this.planRep.createQueryBuilder('p');
    qb.where('p.delFlag = :delFlag', { delFlag: '0' });

    if (query.planType) qb.andWhere('p.planType = :planType', { planType: query.planType });
    if (query.planStatus) qb.andWhere('p.planStatus = :planStatus', { planStatus: query.planStatus });
    if (query.planName) qb.andWhere('p.planName LIKE :planName', { planName: `%${query.planName}%` });
    if (query.deptId) qb.andWhere('p.deptId = :deptId', { deptId: query.deptId });

    qb.orderBy('p.sort', 'ASC').addOrderBy('p.createTime', 'DESC');

    const [list, total] = await qb.skip((pageNum - 1) * pageSize).take(pageSize).getManyAndCount();

    return ResultData.ok({ list, total });
  }

  async findOne(id: number) {
    const plan = await this.planRep.findOne({ where: { id, delFlag: '0' } });
    if (!plan) {
      return ResultData.fail(500, '巡检计划不存在');
    }
    if (plan.routeId) {
      const route = await this.routeRep.findOne({ where: { id: plan.routeId, delFlag: '0' } });
      return ResultData.ok({ ...plan, route });
    }
    return ResultData.ok(plan);
  }

  async update(updateDto: any, user: any) {
    updateDto.updateBy = user.userName;
    await this.planRep.update(updateDto.id, updateDto);
    return ResultData.ok();
  }

  async remove(id: number) {
    await this.planRep.update(id, { delFlag: '1' });
    return ResultData.ok();
  }

  async updateStatus(id: number, planStatus: string, user: any) {
    const plan = await this.planRep.findOne({ where: { id, delFlag: '0' } });
    if (!plan) {
      return ResultData.fail(500, '巡检计划不存在');
    }
    plan.planStatus = planStatus;
    plan.updateBy = user.userName;
    await this.planRep.save(plan);
    return ResultData.ok();
  }
}
