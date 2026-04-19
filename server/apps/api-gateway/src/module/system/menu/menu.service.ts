import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, In } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { SysMenuEntity } from '@app/common';
import { SysRoleWithMenuEntity } from '@app/common';
import { CreateMenuDto, UpdateMenuDto, ListDeptDto } from './dto/index';
import { ListToTree, Uniq } from '@app/common/utils/index';
import { UserService } from '../user/user.service';
import { buildMenus } from './utils';
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class MenuService {
    constructor(@Inject('MICRO_SYSTEM') private readonly client: ClientProxy) {
    }

  async create(createMenuDto: CreateMenuDto) {
      return firstValueFrom(this.client.send('system.menu.create', createMenuDto));
  }

  async findAll(query: ListDeptDto) {
      return firstValueFrom(this.client.send('system.menu.findAll', query));
  }

  async treeSelect() {
      return firstValueFrom(this.client.send('system.menu.treeSelect', {}));
  }

  async roleMenuTreeselect(roleId: number): Promise<any> {
      return firstValueFrom(this.client.send('system.menu.roleMenuTreeselect', roleId));
  }

  async findOne(menuId: number) {
      return firstValueFrom(this.client.send('system.menu.findOne', menuId));
  }

  async update(updateMenuDto: UpdateMenuDto) {
      return firstValueFrom(this.client.send('system.menu.update', updateMenuDto));
  }

  async remove(menuId: number) {
      return firstValueFrom(this.client.send('system.menu.remove', menuId));
  }

  async findMany(where: FindManyOptions<SysMenuEntity>) {
      return firstValueFrom(this.client.send('system.menu.findMany', where));
  }

  /**
   * 根据用户ID查询菜单
   *
   * @param userId 用户ID
   * @return 菜单列表
   */
  async getMenuListByUserId(userId: number) {
      return firstValueFrom(this.client.send('system.menu.getMenuListByUserId', userId));
  }
}
