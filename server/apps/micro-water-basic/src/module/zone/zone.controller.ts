import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ZoneService } from './zone.service';

@Controller()
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  @MessagePattern('waterBasic.zone.create')
  create(@Payload() payload: any) {
    return this.zoneService.create(payload.dto, payload.user);
  }

  @MessagePattern('waterBasic.zone.findTree')
  findTree(@Payload() payload: any) {
    return this.zoneService.findTree(payload.query, payload.user);
  }

  @MessagePattern('waterBasic.zone.findOne')
  findOne(@Payload() id: any) {
    return this.zoneService.findOne(id);
  }

  @MessagePattern('waterBasic.zone.update')
  update(@Payload() payload: any) {
    return this.zoneService.update(payload.dto, payload.user);
  }

  @MessagePattern('waterBasic.zone.remove')
  remove(@Payload() id: any) {
    return this.zoneService.remove(id);
  }
}
