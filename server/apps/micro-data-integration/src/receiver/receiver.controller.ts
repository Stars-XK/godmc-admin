import { Controller, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReceiverService } from './receiver.service';
import { ResultData } from '@app/common/utils/result';

@ApiTags('数据接收与模拟')
@Controller('data-integration/receiver')
export class ReceiverController {
  constructor(private readonly receiverService: ReceiverService) {}

  @ApiOperation({ summary: '模拟产生设备数据' })
  @Post('mock/generate')
  async generateMockData(
    @Body() body: { deviceCode: string; pointCode: string; min: number; max: number; count: number },
  ) {
    const { deviceCode, pointCode, min = 0, max = 100, count = 10 } = body;
    const results = await this.receiverService.generateMockData(deviceCode, pointCode, min, max, count);
    return ResultData.ok(results);
  }

  @ApiOperation({ summary: '接收 HTTP 推送的数据' })
  @Post('push/:taskId')
  async receiveData(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() payload: any,
  ) {
    const result = await this.receiverService.receiveData(taskId, payload);
    return ResultData.ok(result);
  }
}