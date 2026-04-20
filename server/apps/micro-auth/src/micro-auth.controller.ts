import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MicroAuthService } from './micro-auth.service';

@Controller()
export class MicroAuthController {
  constructor(private readonly microAuthService: MicroAuthService) {}

  @MessagePattern('login')
  login(@Payload() data: { user: any; clientInfo: any }) {
    return this.microAuthService.login(data.user, data.clientInfo);
  }

  @MessagePattern('logout')
  logout(@Payload() data: { user: any; clientInfo: any }) {
    return this.microAuthService.logout(data.user, data.clientInfo);
  }

  @MessagePattern('register')
  register(@Payload() user: any) {
    return this.microAuthService.register(user);
  }

  @MessagePattern('registerUser')
  registerUser() {
    return this.microAuthService.registerUser();
  }

  @MessagePattern('captchaImage')
  captchaImage() {
    return this.microAuthService.captchaImage();
  }
}
