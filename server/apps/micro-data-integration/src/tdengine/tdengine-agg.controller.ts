import { Controller, Post, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TdengineAggScheduler } from './tdengine-agg.scheduler';
import { TdengineRetryScheduler } from './tdengine-retry.scheduler';
import { TdengineZoneAggScheduler } from './tdengine-zone-agg.scheduler';
import { ResultData, NotRequireAuth } from '@app/common';

@ApiTags('时序数据库聚合计算与重试引擎调度')
@Controller('tdengine-agg')
export class TdengineAggController {
  private readonly logger = new Logger(TdengineAggController.name);

  constructor(
    private readonly tdengineAggScheduler: TdengineAggScheduler,
    private readonly tdengineRetryScheduler: TdengineRetryScheduler,
    private readonly tdengineZoneAggScheduler: TdengineZoneAggScheduler,
  ) {}

  @ApiOperation({ summary: '处理测点脏数据(5m,1h,1d聚合)' })
  @Post('dirty-points')
  @NotRequireAuth()
  async processDirtyPoints() {
    try {
      await this.tdengineAggScheduler.processDirtyPoints();
      return ResultData.ok('测点脏数据聚合调度成功');
    } catch (e) {
      this.logger.error('测点脏数据聚合失败', e);
      return ResultData.fail(500, e.message);
    }
  }

  @ApiOperation({ summary: '处理分区脏数据(分区指标聚合)' })
  @Post('dirty-zones')
  @NotRequireAuth()
  async processDirtyZones() {
    try {
      await this.tdengineZoneAggScheduler.processDirtyZones();
      return ResultData.ok('分区脏数据聚合调度成功');
    } catch (e) {
      this.logger.error('分区脏数据聚合失败', e);
      return ResultData.fail(500, e.message);
    }
  }

  @ApiOperation({ summary: '重放失败的插入请求(死信队列重试)' })
  @Post('retry-inserts')
  @NotRequireAuth()
  async replayFailedInserts() {
    try {
      await this.tdengineRetryScheduler.replayFailedInserts();
      return ResultData.ok('TDengine 重试队列处理成功');
    } catch (e) {
      this.logger.error('TDengine 重试队列处理失败', e);
      return ResultData.fail(500, e.message);
    }
  }
}
