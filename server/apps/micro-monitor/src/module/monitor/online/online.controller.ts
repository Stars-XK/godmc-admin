import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OnlineService } from './online.service';

@Controller()
export class OnlineController {
  constructor(private readonly onlineService: OnlineService) {}

  @MessagePattern('monitor.online.findAll')
  findAll(@Payload() query: any) {
    return this.onlineService.findAll(query);
  }

  @MessagePattern('monitor.online.delete')
  delete(@Payload() token: string) {
    return this.onlineService.delete(token);
  }
}
