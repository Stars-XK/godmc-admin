import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@app/shared';
import * as bcrypt from 'bcryptjs';
import { GetNowDate, GenerateUUID, Uniq } from '@app/common/utils/index';
import { createMath } from '@app/common/utils/captcha';
import { ResultData, SUCCESS_CODE } from '@app/common/utils/result';
import { CacheEnum, DelFlagEnum, StatusEnum } from '@app/common/enum/index';
import { LOGIN_TOKEN_EXPIRESIN, SYS_USER_TYPE } from '@app/common/constant/index';
import { AxiosService } from '@app/shared';

import {
  UserEntity,
  SysDeptEntity,
  SysRoleEntity,
  SysPostEntity,
  SysUserWithRoleEntity,
  SysUserWithPostEntity,
  SysRoleWithMenuEntity,
  SysMenuEntity,
  SysConfigEntity,
  MonitorLoginlogEntity,
} from '@app/common';

@Injectable()
export class MicroAuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(SysDeptEntity)
    private readonly sysDeptEntityRep: Repository<SysDeptEntity>,
    @InjectRepository(SysRoleEntity)
    private readonly sysRoleEntityRep: Repository<SysRoleEntity>,
    @InjectRepository(SysPostEntity)
    private readonly sysPostEntityRep: Repository<SysPostEntity>,
    @InjectRepository(SysUserWithRoleEntity)
    private readonly sysUserWithRoleEntityRep: Repository<SysUserWithRoleEntity>,
    @InjectRepository(SysUserWithPostEntity)
    private readonly sysUserWithPostEntityRep: Repository<SysUserWithPostEntity>,
    @InjectRepository(SysRoleWithMenuEntity)
    private readonly sysRoleWithMenuEntityRep: Repository<SysRoleWithMenuEntity>,
    @InjectRepository(SysMenuEntity)
    private readonly sysMenuEntityRep: Repository<SysMenuEntity>,
    @InjectRepository(SysConfigEntity)
    private readonly sysConfigEntityRep: Repository<SysConfigEntity>,
    @InjectRepository(MonitorLoginlogEntity)
    private readonly loginlogEntityRep: Repository<MonitorLoginlogEntity>,

    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly axiosService: AxiosService,
  ) {}

  async login(user: any, clientInfo: any) {
    const loginLog = {
      ...clientInfo,
      status: '0',
      msg: '',
    };
    try {
      const loginLocation = await this.axiosService.getIpAddress(clientInfo.ipaddr);
      loginLog.loginLocation = loginLocation;
    } catch (error) {}

    const loginRes = await this.doLogin(user, clientInfo);
    
    loginLog.status = loginRes.code === SUCCESS_CODE ? '0' : '1';
    loginLog.msg = loginRes.msg;

    if (loginRes.data && loginRes.data.userName) {
      loginLog.userName = loginRes.data.userName;
      delete loginRes.data.userName;
    } else {
      loginLog.userName = user.userName;
    }
    
    await this.loginlogEntityRep.save(loginLog);

    return loginRes;
  }

  private async doLogin(user: any, clientInfo: any) {
    // 校验验证码
    const enable = await this.getConfigValue('sys.account.captchaEnabled');
    const captchaEnabled = enable === 'true';
    if (captchaEnabled) {
      const code = await this.redisService.get(CacheEnum.CAPTCHA_CODE_KEY + user.uuid);
      if (!code) {
        return ResultData.fail(500, '验证码已过期');
      }
      if (code !== user.code.toLowerCase()) {
        return ResultData.fail(500, '验证码错误');
      }
      await this.redisService.del(CacheEnum.CAPTCHA_CODE_KEY + user.uuid);
    }

    const data = await this.userRepo.findOne({
      where: { userName: user.userName },
      select: ['userId', 'password'],
    });

    if (!(data && bcrypt.compareSync(user.password, data.password))) {
      return ResultData.fail(500, `帐号或密码错误`);
    }

    const userData = await this.getUserinfo(data.userId);

    if (userData.delFlag === DelFlagEnum.DELETE) {
      return ResultData.fail(500, `您已被禁用，如需正常使用请联系管理员`);
    }
    if (userData.status === StatusEnum.STOP) {
      return ResultData.fail(500, `您已被停用，如需正常使用请联系管理员`);
    }

    const loginDate = new Date();
    await this.userRepo.update(
      { userId: data.userId },
      { loginDate: loginDate, loginIp: clientInfo.ipaddr },
    );

    const uuid = GenerateUUID();
    const token = this.jwtService.sign({ uuid: uuid, userId: userData.userId });
    const permissions = await this.getUserPermissions(userData.userId);
    
    const deptData = await this.sysDeptEntityRep.findOne({
      where: { deptId: userData.deptId },
      select: ['deptName'],
    });

    userData['deptName'] = deptData?.deptName || '';
    const roles = userData.roles.map((item) => item.roleKey);

    const userInfo = {
      browser: clientInfo.browser,
      ipaddr: clientInfo.ipaddr,
      loginLocation: clientInfo.loginLocation,
      loginTime: loginDate,
      os: clientInfo.os,
      permissions: permissions,
      roles: roles,
      token: uuid,
      user: userData,
      userId: userData.userId,
      userName: userData.userName,
      deptId: userData.deptId,
    };

    await this.redisService.set(`${CacheEnum.LOGIN_TOKEN_KEY}${uuid}`, userInfo, LOGIN_TOKEN_EXPIRESIN);

    return ResultData.ok(
      {
        token,
        userName: userData.userName,
      },
      '登录成功',
    );
  }

  async logout(user: any, clientInfo: any) {
    if (user?.token) {
      await this.redisService.del(`${CacheEnum.LOGIN_TOKEN_KEY}${user.token}`);
    }
    
    const loginLog = {
      ...clientInfo,
      status: '0',
      msg: '退出成功',
      userName: user?.user?.userName || '',
    };
    try {
      const loginLocation = await this.axiosService.getIpAddress(clientInfo.ipaddr);
      loginLog.loginLocation = loginLocation;
    } catch (error) {}
    
    await this.loginlogEntityRep.save(loginLog);
    return ResultData.ok();
  }

  async register(user: any) {
    const loginDate = GetNowDate();
    const salt = bcrypt.genSaltSync(10);
    if (user.password) {
      user.password = await bcrypt.hashSync(user.password, salt);
    }
    const checkUserNameUnique = await this.userRepo.findOne({
      where: { userName: user.userName },
      select: ['userName'],
    });
    if (checkUserNameUnique) {
      return ResultData.fail(500, `保存用户'${user.userName}'失败，注册账号已存在`);
    }
    user['nickName'] = user.userName;
    await this.userRepo.save({ ...user, loginDate, userType: SYS_USER_TYPE.CUSTOM });
    return ResultData.ok();
  }

  async registerUser() {
    const enable = await this.getConfigValue('sys.account.registerUser');
    return ResultData.ok(enable === 'true', '操作成功');
  }

  async captchaImage() {
    const enable = await this.getConfigValue('sys.account.captchaEnabled');
    const captchaEnabled = enable === 'true';
    const data = {
      captchaEnabled,
      img: '',
      uuid: '',
    };
    try {
      if (captchaEnabled) {
        const captchaInfo = createMath();
        data.img = captchaInfo.data;
        data.uuid = GenerateUUID();
        await this.redisService.set(CacheEnum.CAPTCHA_CODE_KEY + data.uuid, captchaInfo.text.toLowerCase(), 1000 * 60 * 5);
      }
      return ResultData.ok(data, '操作成功');
    } catch (err) {
      return ResultData.fail(500, '生成验证码错误，请重试');
    }
  }

  private async getConfigValue(configKey: string) {
    // 优先从缓存获取
    const cacheValue = await this.redisService.get(`${CacheEnum.SYS_CONFIG_KEY}${configKey}`);
    if (cacheValue) return cacheValue;
    
    const data = await this.sysConfigEntityRep.findOne({ where: { configKey: configKey } });
    return data?.configValue;
  }

  private async getRoleIds(userIds: Array<number>) {
    const roleList = await this.sysUserWithRoleEntityRep.find({
      where: { userId: In(userIds) },
      select: ['roleId'],
    });
    return Uniq(roleList.map((item) => item.roleId));
  }

  private async getUserPermissions(userId: number) {
    const roleIds = await this.getRoleIds([userId]);
    if (roleIds.includes(1)) return ['*:*:*'];
    if (roleIds.length === 0) return [];
    
    const list = await this.sysRoleWithMenuEntityRep.find({
      where: { roleId: In(roleIds) },
      select: ['menuId'],
    });
    const menuIds = list.map((item) => item.menuId);
    if (menuIds.length === 0) return [];

    const menus = await this.sysMenuEntityRep.find({
      where: { delFlag: '0', status: '0', menuId: In(menuIds) },
    });
    return Uniq(menus.map((item) => item.perms)).filter((item) => item);
  }

  private async getUserinfo(userId: number) {
    const entity = this.userRepo.createQueryBuilder('user');
    entity.where({
      userId: userId,
      delFlag: DelFlagEnum.NORMAL,
    });
    entity.leftJoinAndMapOne('user.dept', SysDeptEntity, 'dept', 'dept.deptId = user.deptId');
    
    const roleIds = await this.getRoleIds([userId]);
    let roles = [];
    if (roleIds.length > 0) {
      roles = await this.sysRoleEntityRep.find({
        where: { delFlag: '0', roleId: In(roleIds) },
      });
    }

    const postList = await this.sysUserWithPostEntityRep.find({
      where: { userId: userId },
      select: ['postId'],
    });
    const postIds = postList.map((item) => item.postId);
    
    let posts = [];
    if (postIds.length > 0) {
      posts = await this.sysPostEntityRep.find({
        where: { delFlag: '0', postId: In(postIds) },
      });
    }

    const data = await entity.getOne();

    return {
      ...data,
      roles,
      posts,
      dept: (data as any).dept,
    };
  }
}
