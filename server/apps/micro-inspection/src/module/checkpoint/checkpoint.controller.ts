import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckpointService } from './checkpoint.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { User } from '@app/common/decorators/user.decorator';

@ApiTags('巡检管理 - 检查点与检查项')
@ApiBearerAuth()
@Controller('inspection/checkpoint')
export class CheckpointController {
  constructor(private readonly checkpointService: CheckpointService) {}

  // ================= 检查点 =================

  @ApiOperation({ summary: '新增检查点' })
  @RequirePermission('inspection:checkpoint:add')
  @Post()
  create(@Body() createDto: any, @User() user: any) {
    return this.checkpointService.create(createDto, user);
  }

  @ApiOperation({ summary: '查询检查点列表' })
  @RequirePermission('inspection:checkpoint:query')
  @Get('list')
  findList(@Query() query: any) {
    return this.checkpointService.findList(query);
  }

  @ApiOperation({ summary: '查询检查点详情（含检查项）' })
  @RequirePermission('inspection:checkpoint:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkpointService.findOne(+id);
  }

  @ApiOperation({ summary: '修改检查点' })
  @RequirePermission('inspection:checkpoint:edit')
  @Put()
  update(@Body() updateDto: any, @User() user: any) {
    return this.checkpointService.update(updateDto, user);
  }

  @ApiOperation({ summary: '删除检查点' })
  @RequirePermission('inspection:checkpoint:remove')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checkpointService.remove(+id);
  }

  // ================= 检查项 =================

  @ApiOperation({ summary: '新增检查项' })
  @RequirePermission('inspection:checkpoint:add')
  @Post('item')
  createItem(@Body() createDto: any, @User() user: any) {
    return this.checkpointService.createItem(createDto, user);
  }

  @ApiOperation({ summary: '查询检查点的检查项列表' })
  @RequirePermission('inspection:checkpoint:query')
  @Get(':checkpointId/items')
  findItemList(@Param('checkpointId') checkpointId: string) {
    return this.checkpointService.findItemList(+checkpointId);
  }

  @ApiOperation({ summary: '修改检查项' })
  @RequirePermission('inspection:checkpoint:edit')
  @Put('item')
  updateItem(@Body() updateDto: any, @User() user: any) {
    return this.checkpointService.updateItem(updateDto, user);
  }

  @ApiOperation({ summary: '删除检查项' })
  @RequirePermission('inspection:checkpoint:remove')
  @Delete('item/:id')
  removeItem(@Param('id') id: string) {
    return this.checkpointService.removeItem(+id);
  }
}
