import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecordService } from './record.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { User } from '@app/common/decorators/user.decorator';

@ApiTags('巡检管理 - 巡检记录')
@ApiBearerAuth()
@Controller('inspection/record')
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @ApiOperation({ summary: '提交巡检记录（单条）' })
  @RequirePermission('inspection:record:add')
  @Post('submit')
  submit(@Body() submitDto: any, @User() user: any) {
    return this.recordService.submit(submitDto, user);
  }

  @ApiOperation({ summary: '批量提交巡检记录' })
  @RequirePermission('inspection:record:add')
  @Post('batch-submit')
  batchSubmit(@Body() batchDto: any, @User() user: any) {
    return this.recordService.batchSubmit(batchDto, user);
  }

  @ApiOperation({ summary: '查询巡检记录列表' })
  @RequirePermission('inspection:record:query')
  @Get('list')
  findList(@Query() query: any) {
    return this.recordService.findList(query);
  }

  @ApiOperation({ summary: '查询某任务的巡检记录' })
  @RequirePermission('inspection:record:query')
  @Get('task/:taskId')
  findByTaskId(@Param('taskId') taskId: string) {
    return this.recordService.findByTaskId(+taskId);
  }
}
