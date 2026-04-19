import { Controller, Get } from '@nestjs/common';
import { MicroMonitorService } from './micro-monitor.service';

@Controller()
export class MicroMonitorController {
  constructor(private readonly microMonitorService: MicroMonitorService) {}

  @Get()
  getHello(): string {
    return this.microMonitorService.getHello();
  }
}
