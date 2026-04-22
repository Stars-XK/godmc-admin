import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MicroWaterBasicService } from './micro-water-basic.service';

@Controller()
export class MicroWaterBasicController {
  constructor(private readonly microWaterBasicService: MicroWaterBasicService) {}

  @Get()
  getHello(): string {
    return this.microWaterBasicService.getHello();
  }

  @MessagePattern('water.status.batchUpdate')
  async batchUpdateStatus(@Payload() payload: { points: {code: string, status: string}[], devices: {code: string, status: string}[], stations: {code: string, status: string}[] }) {
    return this.microWaterBasicService.batchUpdateStatus(payload);
  }
}
