import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { User } from '@app/common/decorators/user.decorator';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';

@ApiTags('巡检管理 - 实时追踪')
@ApiBearerAuth()
@Controller('inspection/tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @ApiOperation({ summary: '上报GPS位置（单条）' })
  @RequirePermission('inspection:tracking:add')
  @Post('location')
  uploadLocation(@Body() data: any, @User() user: any) {
    return this.trackingService.uploadLocation(data, user);
  }

  @ApiOperation({ summary: '批量上报GPS位置（离线同步）' })
  @RequirePermission('inspection:tracking:add')
  @Post('batch')
  batchUpload(@Body() data: any, @User() user: any) {
    return this.trackingService.batchUpload(data, user);
  }

  @ApiOperation({ summary: '查询任务轨迹' })
  @RequirePermission('inspection:tracking:query')
  @Get('trail/:taskId')
  getTrail(@Param('taskId') taskId: string, @Query() query?: { start?: string; end?: string }) {
    return this.trackingService.getTrail(+taskId, query);
  }

  @ApiOperation({ summary: '获取所有在线巡检员实时位置' })
  @RequirePermission('inspection:tracking:query')
  @Get('live')
  getLivePositions() {
    return this.trackingService.getLivePositions();
  }

  @ApiOperation({ summary: '获取单个巡检员实时位置' })
  @RequirePermission('inspection:tracking:query')
  @Get('live/:userId')
  getLivePosition(@Param('userId') userId: string) {
    return this.trackingService.getLivePosition(+userId);
  }
}
