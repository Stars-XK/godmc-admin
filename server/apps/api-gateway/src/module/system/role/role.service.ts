import { Injectable, Inject } from '@nestjs/common';
import { Response } from 'express';
import { ResultData } from '@app/common/utils/result';
import { ListToTree } from '@app/common/utils/index';
import { ExportTable } from '@app/common/utils/export';

import { DataScopeEnum } from '@app/common/enum/index';
import { SysRoleEntity } from '@app/common';
import { SysRoleWithMenuEntity } from '@app/common';
import { SysRoleWithDeptEntity } from '@app/common';
import { SysDeptEntity } from '@app/common';
import { MenuService } from '../menu/menu.service';
import { CreateRoleDto, UpdateRoleDto, ListRoleDto, ChangeStatusDto } from './dto/index';
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class RoleService {
    constructor(@Inject('MICRO_SYSTEM') private readonly client: ClientProxy) {
    }

  async create(createRoleDto: CreateRoleDto) {
      return firstValueFrom(this.client.send('system.role.create', createRoleDto));
  }

  async findAll(query: ListRoleDto) {
      return firstValueFrom(this.client.send('system.role.findAll', query));
  }

  async findOne(roleId: number) {
      return firstValueFrom(this.client.send('system.role.findOne', roleId));
  }

  async update(updateRoleDto: UpdateRoleDto) {
      return firstValueFrom(this.client.send('system.role.update', updateRoleDto));
  }

  async dataScope(updateRoleDto: UpdateRoleDto) {
      return firstValueFrom(this.client.send('system.role.dataScope', updateRoleDto));
  }

  async changeStatus(changeStatusDto: ChangeStatusDto) {
      return firstValueFrom(this.client.send('system.role.changeStatus', changeStatusDto));
  }

  async remove(roleIds: number[]) {
      return firstValueFrom(this.client.send('system.role.remove', roleIds));
  }

  async deptTree(roleId: number) {
      return firstValueFrom(this.client.send('system.role.deptTree', roleId));
  }

  
  /**
   * 根据角色获取用户权限列表
   */
  async getPermissionsByRoleIds(roleIds: number[]) {
      return firstValueFrom(this.client.send('system.role.getPermissionsByRoleIds', roleIds));
  }

  /**
   * 根据角色ID异步查找与之关联的部门ID列表。
   *
   * @param roleId - 角色的ID，用于查询与该角色关联的部门。
   * @returns 返回一个Promise，该Promise解析为一个部门ID的数组。
   */
  async findRoleWithDeptIds(roleId: number) {
      return firstValueFrom(this.client.send('system.role.findRoleWithDeptIds', roleId));
  }

  /**
   * 导出角色管理数据为xlsx
   * @param res
   */
  async export(res: Response, body: ListRoleDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '角色数据',
      data: list.data.list,
      header: [
        { title: '角色编号', dataIndex: 'roleId' },
        { title: '角色名称', dataIndex: 'roleName', width: 15 },
        { title: '权限字符', dataIndex: 'roleKey' },
        { title: '显示顺序', dataIndex: 'roleSort' },
        { title: '状态', dataIndex: 'status' },
        { title: '创建时间', dataIndex: 'createTime', width: 15 },
      ],
    };
    ExportTable(options, res);
  }
}
