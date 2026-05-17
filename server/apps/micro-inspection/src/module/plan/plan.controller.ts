import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { User } from '@app/common/decorators/user.decorator';

@ApiTags('巡检管理 - 巡检计划')
@ApiBearerAuth()
@Controller('inspection/plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @ApiOperation({ summary: '新增巡检计划' })
  @RequirePermission('inspection:plan:add')
  @Post()
  create(@Body() createDto: any, @User() user: any) {
    return this.planService.create(createDto, user);
  }

  @ApiOperation({ summary: '查询巡检计划列表' })
  @RequirePermission('inspection:plan:query')
  @Get('list')
  findList(@Query() query: any) {
    return this.planService.findList(query);
  }

  @ApiOperation({ summary: '查询巡检计划详情' })
  @RequirePermission('inspection:plan:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planService.findOne(+id);
  }

  @ApiOperation({ summary: '修改巡检计划' })
  @RequirePermission('inspection:plan:edit')
  @Put()
  update(@Body() updateDto: any, @User() user: any) {
    return this.planService.update(updateDto, user);
  }

  @ApiOperation({ summary: '删除巡检计划' })
  @RequirePermission('inspection:plan:remove')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.planService.remove(+id);
  }

  @ApiOperation({ summary: '激活/暂停/归档计划' })
  @RequirePermission('inspection:plan:edit')
  @Put('status/:id')
  updateStatus(@Param('id') id: string, @Body() body: any, @User() user: any) {
    return this.planService.updateStatus(+id, body.planStatus, user);
  }
}
