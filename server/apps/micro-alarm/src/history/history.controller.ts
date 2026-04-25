import { Controller, Get, Put, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { User, UserDto } from '@app/common/decorators/user.decorator';
import { ResolveHistoryDto } from './dto/history.dto';

@ApiTags('报警历史管理')
@Controller('alarm/history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @ApiOperation({ summary: '获取报警历史列表' })
  @RequirePermission('alarm:history:list')
  @Get('list')
  findAll(@Query() query: any) {
    return this.historyService.findAll(query);
  }

  @ApiOperation({ summary: '处理报警记录' })
  @RequirePermission('alarm:history:resolve')
  @Put('resolve')
  resolve(@Body() resolveDto: ResolveHistoryDto, @User() user: UserDto) {
    return this.historyService.resolve(resolveDto, user.user?.userName || '');
  }
}
