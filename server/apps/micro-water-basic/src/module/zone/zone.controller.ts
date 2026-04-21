import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @ApiOperation({ summary: '懒加载获取下级分区' })
  @Get('lazyChildren')
  findLazyChildren(@Query('parentId') parentId: string, @Query() query: any, @User() user: any) {
    return this.zoneService.findLazyChildren(parentId, query, user);
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

  @ApiOperation({ summary: '导出分区数据' })
  @RequirePermission('water-basic:zone:export')
  @Post('export')
  export(@Res() res: Response, @Body() query: any, @User() user: any) {
    return this.zoneService.export(res, query, user);
  }

  @ApiOperation({ summary: '下载导入模板' })
  @Post('importTemplate')
  importTemplate(@Res() res: Response) {
    return this.zoneService.importTemplate(res);
  }

  @ApiOperation({ summary: '导入分区数据' })
  @RequirePermission('water-basic:zone:import')
  @Post('importData')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        parentId: { type: 'integer' }
      },
    },
  })
  importData(@UploadedFile() file: Express.Multer.File, @Body('parentId') parentId: string, @User() user: any) {
    return this.zoneService.importData(file, parentId ? parseInt(parentId, 10) : 0, user);
  }

  // ================= 关联设备接口 =================
  
  @ApiOperation({ summary: '查询未关联任何分区的设备列表' })
  @Get('unbound/device/list')
  unboundDeviceList(@Query() query: any) {
    return this.zoneService.unboundDeviceList(query);
  }

  @ApiOperation({ summary: '手动勾选绑定设备' })
  @Post('bind/device')
  bindDevices(@Body() body: { zoneCode: string, deviceIds: string[] }) {
    return this.zoneService.bindDevices(body.zoneCode, body.deviceIds);
  }

  @ApiOperation({ summary: '通过Excel批量导入绑定设备' })
  @Post('bind/device/import')
  importBindDevices(@Body() body: { zoneCode: string, mode: string, dataList: any[] }) {
    return this.zoneService.importBindDevices(body.zoneCode, body.mode, body.dataList);
  }

  @ApiOperation({ summary: '下载设备关联模板' })
  @Post('bind/device/template')
  bindDeviceTemplate(@Res() res: Response) {
    return this.zoneService.bindDeviceTemplate(res);
  }

  // ================= 关联营收接口 =================

  @ApiOperation({ summary: '查询未关联任何分区的营收用户列表' })
  @Get('unbound/revenue/list')
  unboundRevenueList(@Query() query: any) {
    return this.zoneService.unboundRevenueList(query);
  }

  @ApiOperation({ summary: '手动勾选绑定营收用户' })
  @Post('bind/revenue')
  bindRevenueUsers(@Body() body: { zoneCode: string, userIds: string[] }) {
    return this.zoneService.bindRevenueUsers(body.zoneCode, body.userIds);
  }

  @ApiOperation({ summary: '通过Excel批量导入绑定营收用户' })
  @Post('bind/revenue/import')
  importBindRevenueUsers(@Body() body: { zoneCode: string, mode: string, dataList: any[] }) {
    return this.zoneService.importBindRevenueUsers(body.zoneCode, body.mode, body.dataList);
  }

  @ApiOperation({ summary: '下载营收关联模板' })
  @Post('bind/revenue/template')
  bindRevenueTemplate(@Res() res: Response) {
    return this.zoneService.bindRevenueTemplate(res);
  }
}
