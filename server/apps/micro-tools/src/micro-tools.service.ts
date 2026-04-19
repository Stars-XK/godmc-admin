import { Injectable } from '@nestjs/common';

@Injectable()
export class MicroToolsService {
  getHello(): string {
    return 'Hello World!';
  }
}
