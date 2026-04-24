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
    @Body() body: { deviceCode: string; pointCode: string; min: number; max: number; count: number; mockType?: string; baseValue?: number; timeRange?: string },
  ) {
    const { deviceCode, pointCode, min = 0, max = 100, count = 10, mockType = 'random', baseValue = 0, timeRange = 'realtime' } = body;
    const results = await this.receiverService.generateMockData(deviceCode, pointCode, min, max, count, mockType, baseValue, timeRange);
    return ResultData.ok(results);
  }

  @ApiOperation({ summary: '模拟产生营收数据' })
  @Post('mock/revenue/generate')
  async generateMockRevenueData(
    @Body() body: { userNo: string; zoneCode: string; min: number; max: number; count: number; mockType?: string; dataType?: '1d'|'1mo'; baseValue?: number; timeRange?: string },
  ) {
    const { userNo, zoneCode, min = 0, max = 100, count = 10, mockType = 'cumulative', dataType = '1d', baseValue = 0, timeRange = '1mo' } = body;
    const results = await this.receiverService.generateMockRevenueData(userNo, zoneCode, min, max, count, mockType, dataType, baseValue, timeRange);
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