import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginlogService } from './loginlog.service';

@Controller()
export class LoginlogController {
  constructor(private readonly loginlogService: LoginlogService) {}

  @MessagePattern('monitor.loginlog.create')
  create(@Payload() createLoginlogDto: any) {
    return this.loginlogService.create(createLoginlogDto);
  }

  @MessagePattern('monitor.loginlog.findAll')
  findAll(@Payload() query: any) {
    return this.loginlogService.findAll(query);
  }

  @MessagePattern('monitor.loginlog.removeAll')
  removeAll() {
    return this.loginlogService.removeAll();
  }

  @MessagePattern('monitor.loginlog.remove')
  remove(@Payload() infoIds: string[]) {
    return this.loginlogService.remove(infoIds);
  }
}
