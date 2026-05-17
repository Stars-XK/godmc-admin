import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IssueService } from './issue.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';

@ApiTags('巡检管理 - 问题管理')
@ApiBearerAuth()
@Controller('inspection/issue')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @ApiOperation({ summary: '查询问题列表' })
  @RequirePermission('inspection:issue:query')
  @Get('list')
  findList(@Query() query: any) {
    return this.issueService.findList(query);
  }
}
