import { Injectable } from '@nestjs/common';

@Injectable()
export class MicroMonitorService {
  getHello(): string {
    return 'Hello World!';
  }
}
