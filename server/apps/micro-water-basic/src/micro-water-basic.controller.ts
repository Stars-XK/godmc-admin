import { Controller, Get } from '@nestjs/common';
import { MicroWaterBasicService } from './micro-water-basic.service';

@Controller()
export class MicroWaterBasicController {
  constructor(private readonly microWaterBasicService: MicroWaterBasicService) {}

  @Get()
  getHello(): string {
    return this.microWaterBasicService.getHello();
  }
}
