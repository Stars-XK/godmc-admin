import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ZoneService {
  constructor(@Inject('MICRO_WATER_BASIC') private readonly microWaterBasicClient: ClientProxy) {}

  create(dto: any, user: any) {
    return this.microWaterBasicClient.send('waterBasic.zone.create', { dto, user });
  }

  findTree(query: any, user: any) {
    return this.microWaterBasicClient.send('waterBasic.zone.findTree', { query, user });
  }

  findOne(id: number) {
    return this.microWaterBasicClient.send('waterBasic.zone.findOne', id);
  }

  update(dto: any, user: any) {
    return this.microWaterBasicClient.send('waterBasic.zone.update', { dto, user });
  }

  remove(id: number) {
    return this.microWaterBasicClient.send('waterBasic.zone.remove', id);
  }
}
