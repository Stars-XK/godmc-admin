import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoleService } from './role.service';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @MessagePattern('system.role.create')
  create(@Payload() createRoleDto: any) {
    return this.roleService.create(createRoleDto);
  }

  @MessagePattern('system.role.findAll')
  findAll(@Payload() query: any) {
    return this.roleService.findAll(query);
  }

  @MessagePattern('system.role.findOne')
  findOne(@Payload() roleId: any) {
    return this.roleService.findOne(roleId);
  }

  @MessagePattern('system.role.update')
  update(@Payload() updateRoleDto: any) {
    return this.roleService.update(updateRoleDto);
  }

  @MessagePattern('system.role.dataScope')
  dataScope(@Payload() updateRoleDto: any) {
    return this.roleService.dataScope(updateRoleDto);
  }

  @MessagePattern('system.role.changeStatus')
  changeStatus(@Payload() changeStatusDto: any) {
    return this.roleService.changeStatus(changeStatusDto);
  }

  @MessagePattern('system.role.remove')
  remove(@Payload() roleIds: any) {
    return this.roleService.remove(roleIds);
  }

  @MessagePattern('system.role.deptTree')
  deptTree(@Payload() roleId: any) {
    return this.roleService.deptTree(roleId);
  }

  @MessagePattern('system.role.findRoles')
  findRoles(@Payload() where: any) {
    return this.roleService.findRoles(where);
  }

  @MessagePattern('system.role.getPermissionsByRoleIds')
  getPermissionsByRoleIds(@Payload() roleIds: any) {
    return this.roleService.getPermissionsByRoleIds(roleIds);
  }

  @MessagePattern('system.role.findRoleWithDeptIds')
  findRoleWithDeptIds(@Payload() roleId: any) {
    return this.roleService.findRoleWithDeptIds(roleId);
  }

}
