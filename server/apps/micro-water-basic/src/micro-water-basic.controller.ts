import { Controller, Get, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MicroWaterBasicService } from './micro-water-basic.service';

@Controller()
export class MicroWaterBasicController {
  private readonly logger = new Logger(MicroWaterBasicController.name);

  constructor(private readonly microWaterBasicService: MicroWaterBasicService) {}

  @Get()
  getHello(): string {
    return this.microWaterBasicService.getHello();
  }

  // 接收状态引擎发来的批量更新指令
  // 注意：status-engine.service.ts 中使用的是 client.emit 发送事件，所以这里必须使用 @EventPattern 而不是 @MessagePattern
  @EventPattern('water.status.batchUpdate')
  async batchUpdateStatus(@Payload() payload: { points: {code: string, iotStatus: string}[], devices: {code: string, iotStatus: string}[], stations: {code: string, iotStatus: string}[] }) {
    return this.microWaterBasicService.batchUpdateStatus(payload);
  }
}
