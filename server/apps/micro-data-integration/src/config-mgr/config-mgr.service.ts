import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataIntegrationSourceEntity, DataIntegrationTaskEntity, DataIntegrationMappingEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';

@Injectable()
export class ConfigMgrService {
  constructor(
    @InjectRepository(DataIntegrationSourceEntity)
    private readonly sourceRep: Repository<DataIntegrationSourceEntity>,
    @InjectRepository(DataIntegrationTaskEntity)
    private readonly taskRep: Repository<DataIntegrationTaskEntity>,
    @InjectRepository(DataIntegrationMappingEntity)
    private readonly mappingRep: Repository<DataIntegrationMappingEntity>,
  ) {}

  // --- DataSource ---
  async sourceList() {
    const list = await this.sourceRep.find({ order: { id: 'DESC' } });
    return ResultData.ok(list);
  }

  async sourceAdd(data: Partial<DataIntegrationSourceEntity>) {
    await this.sourceRep.save(data);
    return ResultData.ok();
  }

  async sourceUpdate(data: Partial<DataIntegrationSourceEntity>) {
    await this.sourceRep.update(data.id, data);
    return ResultData.ok();
  }

  async sourceDelete(id: number) {
    await this.sourceRep.delete(id);
    return ResultData.ok();
  }

  // --- DataTask ---
  async taskList(sourceId?: number) {
    const where = sourceId ? { sourceId } : {};
    const list = await this.taskRep.find({ where, order: { id: 'DESC' } });
    // 连带查询数据源名称
    const result = await Promise.all(list.map(async task => {
      const source = await this.sourceRep.findOne({ where: { id: task.sourceId }});
      return { ...task, sourceName: source?.name };
    }));
    return ResultData.ok(result);
  }

  async taskAdd(data: Partial<DataIntegrationTaskEntity>) {
    const res = await this.taskRep.save(data);
    return ResultData.ok(res);
  }

  async taskUpdate(data: Partial<DataIntegrationTaskEntity>) {
    await this.taskRep.update(data.id, data);
    return ResultData.ok();
  }

  async taskDelete(id: number) {
    await this.taskRep.delete(id);
    // 级联删除映射
    await this.mappingRep.delete({ taskId: id });
    return ResultData.ok();
  }

  // --- DataMapping ---
  async mappingList(taskId: number) {
    const list = await this.mappingRep.find({ where: { taskId }, order: { id: 'ASC' } });
    return ResultData.ok(list);
  }

  async mappingSaveBatch(taskId: number, mappings: Partial<DataIntegrationMappingEntity>[]) {
    await this.mappingRep.delete({ taskId });
    if (mappings && mappings.length > 0) {
      const entities = mappings.map(m => {
        const entity = new DataIntegrationMappingEntity();
        entity.taskId = taskId;
        entity.sourceField = m.sourceField;
        entity.targetField = m.targetField;
        return entity;
      });
      await this.mappingRep.save(entities);
    }
    return ResultData.ok();
  }
}