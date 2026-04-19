import { Controller, Get, Post, Body, HttpCode, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RegisterDto, LoginDto } from '../../main/dto/index';
import { ClientInfo, ClientInfoDto } from '@app/common/decorators/common.decorator';
import { NotRequireAuth, User, UserDto } from '@app/api-gateway/module/system/user/user.decorator';

@ApiTags('Auth模块')
@Controller('/')
@ApiBearerAuth('Authorization')
export class AuthController {
  constructor(@Inject('MICRO_AUTH') private readonly authClient: ClientProxy) {}

  @ApiOperation({ summary: '用户登录' })
  @ApiBody({ type: LoginDto, required: true })
  @Post('/login')
  @HttpCode(200)
  login(@Body() user: LoginDto, @ClientInfo() clientInfo: ClientInfoDto) {
    return firstValueFrom(this.authClient.send('login', { user, clientInfo }));
  }

  @ApiOperation({ summary: '退出登录' })
  @ApiBody({ type: LoginDto, required: true })
  @NotRequireAuth()
  @Post('/logout')
  @HttpCode(200)
  logout(@User() user: UserDto, @ClientInfo() clientInfo: ClientInfoDto) {
    return firstValueFrom(this.authClient.send('logout', { user, clientInfo }));
  }

  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ type: RegisterDto, required: true })
  @Post('/register')
  @HttpCode(200)
  register(@Body() user: RegisterDto) {
    return firstValueFrom(this.authClient.send('register', user));
  }

  @ApiOperation({ summary: '账号自助-是否开启用户注册功能' })
  @Get('/registerUser')
  registerUser() {
    return firstValueFrom(this.authClient.send('registerUser', {}));
  }

  @ApiOperation({ summary: '获取验证图片' })
  @Get('/captchaImage')
  captchaImage() {
    return firstValueFrom(this.authClient.send('captchaImage', {}));
  }
}