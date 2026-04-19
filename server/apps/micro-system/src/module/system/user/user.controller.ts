import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('system.user.create')
  create(@Payload() createUserDto: any) {
    return this.userService.create(createUserDto);
  }

  @MessagePattern('system.user.findAll')
  findAll(@Payload() payload: any) {
    return this.userService.findAll(payload.query, payload.user);
  }

  @MessagePattern('system.user.findPostAndRoleAll')
  findPostAndRoleAll() {
    return this.userService.findPostAndRoleAll();
  }

  @MessagePattern('system.user.findOne')
  findOne(@Payload() userId: any) {
    return this.userService.findOne(userId);
  }

  @MessagePattern('system.user.update')
  update(@Payload() payload: any) {
    return this.userService.update(payload.updateUserDto, payload.userId);
  }

  @MessagePattern('system.user.clearCacheByUserId')
  clearCacheByUserId(@Payload() userId: any) {
    return this.userService.clearCacheByUserId(userId);
  }

  @MessagePattern('system.user.login')
  login(@Payload() payload: any) {
    return this.userService.login(payload.user, payload.clientInfo);
  }

  @MessagePattern('system.user.updateRedisUserRolesAndPermissions')
  updateRedisUserRolesAndPermissions(@Payload() payload: any) {
    return this.userService.updateRedisUserRolesAndPermissions(payload.uuid, payload.userId);
  }

  @MessagePattern('system.user.updateRedisToken')
  updateRedisToken(@Payload() payload: any) {
    return this.userService.updateRedisToken(payload.token, payload.metaData);
  }

  @MessagePattern('system.user.getRoleIds')
  getRoleIds(@Payload() userIds: any) {
    return this.userService.getRoleIds(userIds);
  }

  @MessagePattern('system.user.getUserPermissions')
  getUserPermissions(@Payload() userId: any) {
    return this.userService.getUserPermissions(userId);
  }

  @MessagePattern('system.user.getUserinfo')
  getUserinfo(@Payload() userId: any) {
    return this.userService.getUserinfo(userId);
  }

  @MessagePattern('system.user.register')
  register(@Payload() user: any) {
    return this.userService.register(user);
  }

  @MessagePattern('system.user.createToken')
  createToken(@Payload() payload: any) {
    return this.userService.createToken(payload);
  }

  @MessagePattern('system.user.parseToken')
  parseToken(@Payload() token: any) {
    return this.userService.parseToken(token);
  }

  @MessagePattern('system.user.resetPwd')
  resetPwd(@Payload() body: any) {
    return this.userService.resetPwd(body);
  }

  @MessagePattern('system.user.remove')
  remove(@Payload() ids: any) {
    return this.userService.remove(ids);
  }

  @MessagePattern('system.user.authRole')
  authRole(@Payload() userId: any) {
    return this.userService.authRole(userId);
  }

  @MessagePattern('system.user.updateAuthRole')
  updateAuthRole(@Payload() query: any) {
    return this.userService.updateAuthRole(query);
  }

  @MessagePattern('system.user.changeStatus')
  changeStatus(@Payload() changeStatusDto: any) {
    return this.userService.changeStatus(changeStatusDto);
  }

  @MessagePattern('system.user.deptTree')
  deptTree() {
    return this.userService.deptTree();
  }

  @MessagePattern('system.user.allocatedList')
  allocatedList(@Payload() query: any) {
    return this.userService.allocatedList(query);
  }

  @MessagePattern('system.user.unallocatedList')
  unallocatedList(@Payload() query: any) {
    return this.userService.unallocatedList(query);
  }

  @MessagePattern('system.user.authUserCancel')
  authUserCancel(@Payload() data: any) {
    return this.userService.authUserCancel(data);
  }

  @MessagePattern('system.user.authUserCancelAll')
  authUserCancelAll(@Payload() data: any) {
    return this.userService.authUserCancelAll(data);
  }

  @MessagePattern('system.user.authUserSelectAll')
  authUserSelectAll(@Payload() data: any) {
    return this.userService.authUserSelectAll(data);
  }

  @MessagePattern('system.user.profile')
  profile(@Payload() user: any) {
    return this.userService.profile(user);
  }

  @MessagePattern('system.user.updateProfile')
  updateProfile(@Payload() payload: any) {
    return this.userService.updateProfile(payload.user, payload.updateProfileDto);
  }

  @MessagePattern('system.user.updatePwd')
  updatePwd(@Payload() payload: any) {
    return this.userService.updatePwd(payload.user, payload.updatePwdDto);
  }

}
