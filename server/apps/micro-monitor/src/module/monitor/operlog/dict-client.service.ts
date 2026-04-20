import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DictClientService {
  constructor(@Inject('MICRO_SYSTEM') private readonly client: ClientProxy) {}

  findOneDataType(dictType: string) {
    return firstValueFrom(this.client.send('system.dict.findOneDataType', dictType));
  }
}

