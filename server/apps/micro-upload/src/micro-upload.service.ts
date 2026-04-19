import { Injectable } from '@nestjs/common';

@Injectable()
export class MicroUploadService {
  getHello(): string {
    return 'Hello World!';
  }
}
