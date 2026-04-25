import { Controller, Get } from '@nestjs/common';
import { MicroAlarmService } from './micro-alarm.service';

@Controller()
export class MicroAlarmController {
  constructor(private readonly microAlarmService: MicroAlarmService) {}

  @Get()
  getHello(): string {
    return this.microAlarmService.getHello();
  }
}
