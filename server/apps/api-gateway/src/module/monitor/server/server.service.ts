import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ServerService {
  constructor(@Inject('MICRO_MONITOR') private readonly client: ClientProxy) {}

  async getInfo() {
    return firstValueFrom(this.client.send('monitor.server.getInfo', {}));
  }

  async getDiskStatus() {
    return firstValueFrom(this.client.send('monitor.server.getDiskStatus', {}));
  }
}
