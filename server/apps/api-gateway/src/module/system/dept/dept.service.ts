import { Injectable, Inject } from '@nestjs/common';
import { ResultData } from '@app/common/utils/result';
import { SysDeptEntity } from '@app/common';
import { CreateDeptDto, UpdateDeptDto, ListDeptDto } from './dto/index';
import { ListToTree } from '@app/common/utils/index';
import { CacheEnum, DataScopeEnum } from '@app/common/enum/index';
import { Cacheable, CacheEvict } from '@app/common/decorators/redis.decorator';
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class DeptService {
    constructor(@Inject('MICRO_SYSTEM') private readonly client: ClientProxy) {
    }

  @CacheEvict(CacheEnum.SYS_DEPT_KEY, '*')
  async create(createDeptDto: CreateDeptDto) {
      return firstValueFrom(this.client.send('system.dept.create', createDeptDto));
  }

  async findAll(query: ListDeptDto) {
      return firstValueFrom(this.client.send('system.dept.findAll', query));
  }

  @Cacheable(CacheEnum.SYS_DEPT_KEY, 'findOne:{deptId}')
  async findOne(deptId: number) {
      return firstValueFrom(this.client.send('system.dept.findOne', deptId));
  }

  /**
   * 根据数据权限范围和部门ID查询部门ID列表。
   * @param deptId 部门ID，表示需要查询的部门。
   * @param dataScope 数据权限范围，决定查询的部门范围。
   * @returns 返回一个部门ID数组，根据数据权限范围决定返回的部门ID集合。
   */
  @Cacheable(CacheEnum.SYS_DEPT_KEY, 'findDeptIdsByDataScope:{deptId}-{dataScope}')
  async findDeptIdsByDataScope(deptId: number, dataScope: DataScopeEnum) {
      return firstValueFrom(this.client.send('system.dept.findDeptIdsByDataScope', { deptId, dataScope }));
  }

  /**
   * 添加查询条件以适应本部门数据权限范围。
   * @param queryBuilder 查询构建器实例
   * @param deptId 部门ID
   */
  private addQueryForDeptDataScope(queryBuilder: any, deptId: number) {
    queryBuilder.andWhere('dept.deptId = :deptId', { deptId: deptId });
  }

  /**
   * 添加查询条件以适应本部门及子部门数据权限范围。
   * @param queryBuilder 查询构建器实例
   * @param deptId 部门ID
   */
  private addQueryForDeptAndChildDataScope(queryBuilder: any, deptId: number) {
    // 使用参数化查询以防止SQL注入
    queryBuilder
      .andWhere('dept.ancestors LIKE :ancestors', {
        ancestors: `%${deptId}%`,
      })
      .orWhere('dept.deptId = :deptId', { deptId: deptId });
  }

  @Cacheable(CacheEnum.SYS_DEPT_KEY, 'findListExclude')
  async findListExclude(id: number) {
      return firstValueFrom(this.client.send('system.dept.findListExclude', id));
  }

  @CacheEvict(CacheEnum.SYS_DEPT_KEY, '*')
  async update(updateDeptDto: UpdateDeptDto) {
      return firstValueFrom(this.client.send('system.dept.update', updateDeptDto));
  }

  @CacheEvict(CacheEnum.SYS_DEPT_KEY, '*')
  async remove(deptId: number) {
      return firstValueFrom(this.client.send('system.dept.remove', deptId));
  }

  /**
   * 部门树
   * @returns
   */
  @Cacheable(CacheEnum.SYS_DEPT_KEY, 'deptTree')
  async deptTree() {
      return firstValueFrom(this.client.send('system.dept.deptTree', {}));
  }
}
