import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZoneService } from './zone.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { User } from '@app/common/decorators/user.decorator';

@ApiTags('水务基础-分区管理')
@ApiBearerAuth()
@Controller('water-basic/zone')
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  @ApiOperation({ summary: '新增分区' })
  @RequirePermission('water-basic:zone:add')
  @Post()
  create(@Body() createDto: any, @User() user: any) {
    return this.zoneService.create(createDto, user);
  }

  @ApiOperation({ summary: '查询分区树' })
  @RequirePermission('water-basic:zone:query')
  @Get('tree')
  findTree(@Query() query: any, @User() user: any) {
    return this.zoneService.findTree(query, user);
  }

  @ApiOperation({ summary: '查询分区详情' })
  @RequirePermission('water-basic:zone:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zoneService.findOne(+id);
  }

  @ApiOperation({ summary: '修改分区' })
  @RequirePermission('water-basic:zone:edit')
  @Put()
  update(@Body() updateDto: any, @User() user: any) {
    return this.zoneService.update(updateDto, user);
  }

  @ApiOperation({ summary: '删除分区' })
  @RequirePermission('water-basic:zone:remove')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.zoneService.remove(+id);
  }
}
