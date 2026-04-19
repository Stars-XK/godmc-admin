import { Controller, Get } from '@nestjs/common';
import { MicroToolsService } from './micro-tools.service';

@Controller()
export class MicroToolsController {
  constructor(private readonly microToolsService: MicroToolsService) {}

  @Get()
  getHello(): string {
    return this.microToolsService.getHello();
  }
}
