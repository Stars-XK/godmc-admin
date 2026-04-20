import { Injectable } from '@nestjs/common';

@Injectable()
export class MicroWaterBasicService {
  getHello(): string {
    return 'Hello World!';
  }
}
