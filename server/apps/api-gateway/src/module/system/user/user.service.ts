import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@app/shared';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { GetNowDate, GenerateUUID, Uniq } from '@app/common/utils/index';
import { ExportTable } from '@app/common/utils/export';

import { CacheEnum, DelFlagEnum, StatusEnum, DataScopeEnum } from '@app/common/enum/index';
import { LOGIN_TOKEN_EXPIRESIN, SYS_USER_TYPE } from '@app/common/constant/index';
import { ResultData } from '@app/common/utils/result';
import { CreateUserDto, UpdateUserDto, ListUserDto, ChangeStatusDto, ResetPwdDto, AllocatedListDto, UpdateProfileDto, UpdatePwdDto } from './dto/index';
import { RegisterDto, LoginDto } from '../../main/dto/index';
import { AuthUserCancelDto, AuthUserCancelAllDto, AuthUserSelectAllDto } from '../role/dto/index';

import { UserEntity } from '@app/common';
import { SysUserWithPostEntity } from '@app/common';
import { SysUserWithRoleEntity } from '@app/common';
import { SysPostEntity } from '@app/common';
import { SysDeptEntity } from '@app/common';
import { RoleService } from '../role/role.service';
import { DeptService } from '../dept/dept.service';

import { ConfigService } from '../config/config.service';
import { SysRoleEntity } from '@app/common';
import { SysMenuEntity } from '@app/common';
import { UserType } from './dto/user';
import { ClientInfoDto } from '@app/common/decorators/common.decorator';
import { Cacheable, CacheEvict } from '@app/common/decorators/redis.decorator';
import { Captcha } from '@app/common/decorators/captcha.decorator';
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class UserService {
    constructor(@Inject('MICRO_SYSTEM') private readonly client: ClientProxy) {
    }

  /**
   * 后台创建用户
   * @param createUserDto
   * @returns
   */
  async create(createUserDto: CreateUserDto) {
      return firstValueFrom(this.client.send('system.user.create', createUserDto));
  }

  /**
   * 用户列表
   * @param query
   * @returns
   */
  async findAll(query: ListUserDto, user: UserType['user']) {
      return firstValueFrom(this.client.send('system.user.findAll', { query, user }));
  }

  /**
   * 用户角色+岗位信息
   * @returns
   */
  async findPostAndRoleAll() {
      return firstValueFrom(this.client.send('system.user.findPostAndRoleAll', {}));
  }

  @Cacheable(CacheEnum.SYS_USER_KEY, '{userId}')
  async findOne(userId: number) {
      return firstValueFrom(this.client.send('system.user.findOne', userId));
  }

  /**
   * 更新用户
   * @param updateUserDto
   * @returns
   */
  @CacheEvict(CacheEnum.SYS_USER_KEY, '{updateUserDto.userId}')
  async update(updateUserDto: UpdateUserDto, userId: number) {
      return firstValueFrom(this.client.send('system.user.update', { updateUserDto, userId }));
  }

  @CacheEvict(CacheEnum.SYS_USER_KEY, '{userId}')
  clearCacheByUserId(userId: number) {
      return firstValueFrom(this.client.send('system.user.clearCacheByUserId', userId));
  }

  /**
   * 登陆
   */
  @Captcha('user')
  async login(user: LoginDto, clientInfo: ClientInfoDto) {
      return firstValueFrom(this.client.send('system.user.login', { user, clientInfo }));
  }

  /**
   * 更新redis中用户权限和角色信息
   */
  async updateRedisUserRolesAndPermissions(uuid: string, userId: number) {
      return firstValueFrom(this.client.send('system.user.updateRedisUserRolesAndPermissions', { uuid, userId }));
  }

  /**
   * 更新redis中的元数据
   * @param token
   * @param metaData
   */
  async updateRedisToken(token: string, metaData: Partial<UserType>) {
      return firstValueFrom(this.client.send('system.user.updateRedisToken', { token, metaData }));
  }

  /**
   * 获取角色Id列表
   * @param userId
   * @returns
   */
  async getRoleIds(userIds: Array<number>) {
      return firstValueFrom(this.client.send('system.user.getRoleIds', userIds));
  }

  /**
   * 获取权限列表
   * @param userId
   * @returns
   */
  async getUserPermissions(userId: number) {
      return firstValueFrom(this.client.send('system.user.getUserPermissions', userId));
  }

  /**
   * 获取用户信息
   */
  async getUserinfo(userId: number): Promise<{ dept: SysDeptEntity; roles: Array<SysRoleEntity>; posts: Array<SysPostEntity> } & UserEntity> {
      return firstValueFrom(this.client.send('system.user.getUserinfo', userId));
  }

  /**
   * 注册
   */
  async register(user: RegisterDto) {
      return firstValueFrom(this.client.send('system.user.register', user));
  }

  /**
   * 从数据声明生成令牌
   *
   * @param payload 数据声明
   * @return 令牌
   */
  createToken(payload: { uuid: string; userId: number }): Promise<string> {
      return firstValueFrom(this.client.send('system.user.createToken', payload));
  }

  /**
   * 从令牌中获取数据声明
   *
   * @param token 令牌
   * @return 数据声明
   */
  parseToken(token: string) {
      return firstValueFrom(this.client.send('system.user.parseToken', token));
  }

  /**
   * 重置密码
   * @param body
   * @returns
   */
  async resetPwd(body: ResetPwdDto) {
      return firstValueFrom(this.client.send('system.user.resetPwd', body));
  }

  /**
   * 批量删除用户
   * @param ids
   * @returns
   */
  async remove(ids: number[]) {
      return firstValueFrom(this.client.send('system.user.remove', ids));
  }

  /**
   * 角色详情
   * @param id
   * @returns
   */
  async authRole(userId: number) {
      return firstValueFrom(this.client.send('system.user.authRole', userId));
  }

  /**
   * 更新用户角色信息
   * @param query
   * @returns
   */
  async updateAuthRole(query) {
      return firstValueFrom(this.client.send('system.user.updateAuthRole', query));
  }

  /**
   * 修改用户状态
   * @param changeStatusDto
   * @returns
   */
  async changeStatus(changeStatusDto: ChangeStatusDto) {
      return firstValueFrom(this.client.send('system.user.changeStatus', changeStatusDto));
  }

  /**
   * 部门树
   * @returns
   */
  async deptTree() {
      return firstValueFrom(this.client.send('system.user.deptTree', {}));
  }

  /**
   * 获取角色已分配用户
   * @param query
   * @returns
   */
  async allocatedList(query: AllocatedListDto) {
      return firstValueFrom(this.client.send('system.user.allocatedList', query));
  }

  /**
   * 获取角色未分配用户
   * @param query
   * @returns
   */
  async unallocatedList(query: AllocatedListDto) {
      return firstValueFrom(this.client.send('system.user.unallocatedList', query));
  }

  /**
   * 用户解绑角色
   * @param data
   * @returns
   */
  async authUserCancel(data: AuthUserCancelDto) {
      return firstValueFrom(this.client.send('system.user.authUserCancel', data));
  }

  /**
   * 用户批量解绑角色
   * @param data
   * @returns
   */
  async authUserCancelAll(data: AuthUserCancelAllDto) {
      return firstValueFrom(this.client.send('system.user.authUserCancelAll', data));
  }

  /**
   * 用户批量绑定角色
   * @param data
   * @returns
   */
  async authUserSelectAll(data: AuthUserSelectAllDto) {
      return firstValueFrom(this.client.send('system.user.authUserSelectAll', data));
  }

  /**
   * 个人中心-用户信息
   * @param user
   * @returns
   */
  async profile(user) {
      return firstValueFrom(this.client.send('system.user.profile', user));
  }

  /**
   * 个人中心-用户信息
   * @param user
   * @returns
   */
  async updateProfile(user: UserType, updateProfileDto: UpdateProfileDto) {
      return firstValueFrom(this.client.send('system.user.updateProfile', { user, updateProfileDto }));
  }

  /**
   * 个人中心-修改密码
   * @param user
   * @param updatePwdDto
   * @returns
   */
  async updatePwd(user: UserType, updatePwdDto: UpdatePwdDto) {
      return firstValueFrom(this.client.send('system.user.updatePwd', { user, updatePwdDto }));
  }

  /**
   * 导出用户信息数据为xlsx
   * @param res
   */
  async export(res: Response, body: ListUserDto, user: UserType['user']) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body, user);
    const options = {
      sheetName: '用户数据',
      data: list.data.list,
      header: [
        { title: '用户序号', dataIndex: 'userId' },
        { title: '登录名称', dataIndex: 'userName' },
        { title: '用户昵称', dataIndex: 'nickName' },
        { title: '用户邮箱', dataIndex: 'email' },
        { title: '手机号码', dataIndex: 'phonenumber' },
        { title: '用户性别', dataIndex: 'sex' },
        { title: '账号状态', dataIndex: 'status' },
        { title: '最后登录IP', dataIndex: 'loginIp' },
        { title: '最后登录时间', dataIndex: 'loginDate', width: 20 },
        { title: '部门', dataIndex: 'dept.deptName' },
        { title: '部门负责人', dataIndex: 'dept.leader' },
      ],
    };
    ExportTable(options, res);
  }
}
