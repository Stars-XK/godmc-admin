import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OperlogService } from './operlog.service';

@Controller()
export class OperlogController {
  constructor(private readonly operlogService: OperlogService) {}

  @MessagePattern('monitor.operlog.removeAll')
  removeAll() {
    return this.operlogService.removeAll();
  }

  @MessagePattern('monitor.operlog.findAll')
  findAll(@Payload() query: any) {
    return this.operlogService.findAll(query);
  }

  @MessagePattern('monitor.operlog.findOne')
  findOne(@Payload() operId: number) {
    return this.operlogService.findOne(operId);
  }

  @MessagePattern('monitor.operlog.remove')
  remove(@Payload() operId: number) {
    return this.operlogService.remove(operId);
  }

  @MessagePattern('monitor.operlog.logAction')
  logAction(@Payload() payload: any) {
    return this.operlogService.logAction(payload);
  }
}
