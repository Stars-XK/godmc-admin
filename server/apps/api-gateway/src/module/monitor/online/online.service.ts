import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OnlineService {
  constructor(@Inject('MICRO_MONITOR') private readonly client: ClientProxy) {}

  async findAll(query: any) {
    return firstValueFrom(this.client.send('monitor.online.findAll', query));
  }

  async delete(token: string) {
    return firstValueFrom(this.client.send('monitor.online.delete', token));
  }
}
