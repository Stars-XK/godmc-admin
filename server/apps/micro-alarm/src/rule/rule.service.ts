import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysAlarmRuleEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';

@Injectable()
export class RuleService {
  constructor(
    @InjectRepository(SysAlarmRuleEntity)
    private readonly ruleRepository: Repository<SysAlarmRuleEntity>,
  ) {}

  async create(createDto: Partial<SysAlarmRuleEntity>, user: string) {
    const entity = this.ruleRepository.create({
      ...createDto,
      createBy: user,
      updateBy: user,
    });
    await this.ruleRepository.save(entity);
    return ResultData.ok();
  }

  async findAll(query: any) {
    const qb = this.ruleRepository.createQueryBuilder('rule');

    if (query.ruleName) {
      qb.andWhere('rule.ruleName LIKE :ruleName', { ruleName: `%${query.ruleName}%` });
    }
    if (query.ruleType) {
      qb.andWhere('rule.ruleType = :ruleType', { ruleType: query.ruleType });
    }
    if (query.scopeType) {
      qb.andWhere('rule.scopeType = :scopeType', { scopeType: query.scopeType });
    }
    if (query.status) {
      qb.andWhere('rule.status = :status', { status: query.status });
    }

    qb.orderBy('rule.createTime', 'DESC');

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

  async findOne(id: number) {
    const rule = await this.ruleRepository.findOne({ where: { ruleId: id } });
    if (!rule) {
      return ResultData.fail(500, `Rule with ID ${id} not found`);
    }
    return ResultData.ok(rule);
  }

  async update(id: number, updateDto: Partial<SysAlarmRuleEntity>, user: string) {
    const rule = await this.ruleRepository.findOne({ where: { ruleId: id } });
    if (!rule) {
      return ResultData.fail(500, `Rule with ID ${id} not found`);
    }
    const updated = this.ruleRepository.merge(rule, {
      ...updateDto,
      updateBy: user,
    });
    await this.ruleRepository.save(updated);
    return ResultData.ok();
  }

  async remove(ids: number[]) {
    await this.ruleRepository.delete(ids);
    return ResultData.ok();
  }
}
