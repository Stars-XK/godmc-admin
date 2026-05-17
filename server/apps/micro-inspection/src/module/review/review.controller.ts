import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';

@ApiTags('巡检管理 - 审核管理')
@ApiBearerAuth()
@Controller('inspection/review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @ApiOperation({ summary: '查询任务审核记录' })
  @RequirePermission('inspection:review:query')
  @Get('task/:taskId')
  findByTaskId(@Param('taskId') taskId: string) {
    return this.reviewService.findByTaskId(+taskId);
  }
}
