import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RouteService } from './route.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { User } from '@app/common/decorators/user.decorator';

@ApiTags('巡检管理 - 巡检路线')
@ApiBearerAuth()
@Controller('inspection/route')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @ApiOperation({ summary: '新增巡检路线' })
  @RequirePermission('inspection:route:add')
  @Post()
  create(@Body() createDto: any, @User() user: any) {
    return this.routeService.create(createDto, user);
  }

  @ApiOperation({ summary: '查询巡检路线列表' })
  @RequirePermission('inspection:route:query')
  @Get('list')
  findList(@Query() query: any) {
    return this.routeService.findList(query);
  }

  @ApiOperation({ summary: '查询巡检路线详情' })
  @RequirePermission('inspection:route:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routeService.findOne(+id);
  }

  @ApiOperation({ summary: '修改巡检路线' })
  @RequirePermission('inspection:route:edit')
  @Put()
  update(@Body() updateDto: any, @User() user: any) {
    return this.routeService.update(updateDto, user);
  }

  @ApiOperation({ summary: '删除巡检路线' })
  @RequirePermission('inspection:route:remove')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routeService.remove(+id);
  }

  @ApiOperation({ summary: '获取路线GeoJSON数据' })
  @RequirePermission('inspection:route:query')
  @Get('geojson/:id')
  findGeoJson(@Param('id') id: string) {
    return this.routeService.findGeoJson(+id);
  }

  @ApiOperation({ summary: '获取路线完整设计数据（含检查点和检查项）' })
  @RequirePermission('inspection:route:query')
  @Get('design/:id')
  findDesign(@Param('id') id: string) {
    return this.routeService.findDesign(+id);
  }

  @ApiOperation({ summary: '保存路线完整设计（含检查点和检查项）' })
  @RequirePermission('inspection:route:edit')
  @Post('design')
  saveDesign(@Body() dto: any, @User() user: any) {
    return this.routeService.saveDesign(dto, user);
  }

  @ApiOperation({ summary: '删除路线及其关联检查点' })
  @RequirePermission('inspection:route:remove')
  @Delete('design/:id')
  removeDesign(@Param('id') id: string) {
    return this.routeService.removeDesign(+id);
  }
}
