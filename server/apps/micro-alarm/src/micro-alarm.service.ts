import { Injectable } from '@nestjs/common';

@Injectable()
export class MicroAlarmService {
  getHello(): string {
    return 'Hello World!';
  }
}
