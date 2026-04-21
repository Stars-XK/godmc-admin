import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { User } from '@app/common/decorators/user.decorator';
import { RevenueUserService } from './revenue-user.service';

@ApiTags('营收基础信息')
@Controller('revenue-user')
export class RevenueUserController {
  constructor(private readonly revenueUserService: RevenueUserService) {}

  @ApiOperation({ summary: '查询营收用户列表' })
  @RequirePermission('water-basic:revenue:query')
  @Get('list')
  list(@Query() query: any) {
    return this.revenueUserService.findList(query);
  }

  @ApiOperation({ summary: '获取营收用户详细信息' })
  @RequirePermission('water-basic:revenue:query')
  @Get(':id')
  getInfo(@Param('id') id: string) {
    return this.revenueUserService.findOne(id);
  }

  @ApiOperation({ summary: '新增营收用户' })
  @RequirePermission('water-basic:revenue:add')
  @Post()
  add(@Body() data: any, @User() user: any) {
    return this.revenueUserService.create(data, user);
  }

  @ApiOperation({ summary: '修改营收用户' })
  @RequirePermission('water-basic:revenue:edit')
  @Put()
  edit(@Body() data: any, @User() user: any) {
    return this.revenueUserService.update(data, user);
  }

  @ApiOperation({ summary: '删除营收用户' })
  @RequirePermission('water-basic:revenue:remove')
  @Delete(':ids')
  remove(@Param('ids') ids: string) {
    return this.revenueUserService.remove(ids.split(','));
  }

  @ApiOperation({ summary: '批量导入营收用户数据(前端解析)' })
  @RequirePermission('water-basic:revenue:import')
  @Post('importBatch')
  importBatch(@Body() dataList: any[], @User() user: any) {
    return this.revenueUserService.importBatch(dataList, user);
  }
}