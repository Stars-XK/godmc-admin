import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { User } from '@app/common/decorators/user.decorator';

@ApiTags('巡检管理 - 巡检任务')
@ApiBearerAuth()
@Controller('inspection/task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @ApiOperation({ summary: '新增巡检任务' })
  @RequirePermission('inspection:task:add')
  @Post()
  create(@Body() createDto: any, @User() user: any) {
    return this.taskService.create(createDto, user);
  }

  @ApiOperation({ summary: '查询巡检任务列表' })
  @RequirePermission('inspection:task:query')
  @Get('list')
  findList(@Query() query: any) {
    return this.taskService.findList(query);
  }

  @ApiOperation({ summary: '查询巡检任务详情' })
  @RequirePermission('inspection:task:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(+id);
  }

  @ApiOperation({ summary: '修改巡检任务' })
  @RequirePermission('inspection:task:edit')
  @Put()
  update(@Body() updateDto: any, @User() user: any) {
    return this.taskService.update(updateDto, user);
  }

  @ApiOperation({ summary: '删除巡检任务' })
  @RequirePermission('inspection:task:remove')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(+id);
  }
}
