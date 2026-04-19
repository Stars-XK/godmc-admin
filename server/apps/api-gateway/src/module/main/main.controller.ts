import { Controller, Get, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { MainService } from './main.service';
import { RegisterDto, LoginDto } from '@app/common/dto/index';
import { createMath } from '@app/common/utils/captcha';
import { ResultData } from '@app/common/utils/result';
import { GenerateUUID } from '@app/common/utils/index';
import { RedisService } from '@app/shared';
import { CacheEnum } from '@app/common/enum/index';
import { ConfigService } from '@app/api-gateway/module/system/config/config.service';
import { ClientInfo, ClientInfoDto } from '@app/common/decorators/common.decorator';
import { NotRequireAuth, User, UserDto } from '@app/common';

@ApiTags('根目录')
@Controller('/')
@ApiBearerAuth('Authorization')
export class MainController {
  constructor(
    private readonly mainService: MainService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({
    summary: '用户信息',
  })
  @Get('/getInfo')
  async getInfo(@User() user: UserDto) {
    return {
      msg: '操作成功',
      code: 200,
      permissions: user.permissions,
      roles: user.roles,
      user: user.user,
    };
  }

  @ApiOperation({
    summary: '路由信息',
  })
  @Get('/getRouters')
  getRouters(@User() user: UserDto) {
    const userId = user.user.userId.toString();
    return this.mainService.getRouters(+userId);
  }
}
