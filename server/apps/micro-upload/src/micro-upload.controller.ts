import { Controller, Get } from '@nestjs/common';
import { MicroUploadService } from './micro-upload.service';

@Controller()
export class MicroUploadController {
  constructor(private readonly microUploadService: MicroUploadService) {}

  @Get()
  getHello(): string {
    return this.microUploadService.getHello();
  }
}
