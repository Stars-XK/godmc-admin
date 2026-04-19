import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MenuService } from './menu.service';

@Controller()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @MessagePattern('system.menu.create')
  create(@Payload() createMenuDto: any) {
    return this.menuService.create(createMenuDto);
  }

  @MessagePattern('system.menu.findAll')
  findAll(@Payload() query: any) {
    return this.menuService.findAll(query);
  }

  @MessagePattern('system.menu.treeSelect')
  treeSelect() {
    return this.menuService.treeSelect();
  }

  @MessagePattern('system.menu.roleMenuTreeselect')
  roleMenuTreeselect(@Payload() roleId: any) {
    return this.menuService.roleMenuTreeselect(roleId);
  }

  @MessagePattern('system.menu.findOne')
  findOne(@Payload() menuId: any) {
    return this.menuService.findOne(menuId);
  }

  @MessagePattern('system.menu.update')
  update(@Payload() updateMenuDto: any) {
    return this.menuService.update(updateMenuDto);
  }

  @MessagePattern('system.menu.remove')
  remove(@Payload() menuId: any) {
    return this.menuService.remove(menuId);
  }

  @MessagePattern('system.menu.findMany')
  findMany(@Payload() where: any) {
    return this.menuService.findMany(where);
  }

  @MessagePattern('system.menu.getMenuListByUserId')
  getMenuListByUserId(@Payload() userId: any) {
    return this.menuService.getMenuListByUserId(userId);
  }

}
