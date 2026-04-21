import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DeviceService } from './device.service';
import { User, RequirePermission } from '@app/common';

@ApiTags('水务基础-设备管理')
@ApiBearerAuth()
@Controller('water-basic/device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @ApiOperation({ summary: '获取设备列表' })
  @RequirePermission('water-basic:device:query')
  @Get('list')
  findList(@Query() query: any, @User() user: any) {
    return this.deviceService.findList(query, user);
  }

  @ApiOperation({ summary: '查询设备详情' })
  @RequirePermission('water-basic:device:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deviceService.findOne(+id);
  }

  @ApiOperation({ summary: '新增设备' })
  @RequirePermission('water-basic:device:add')
  @Post()
  create(@Body() createDto: any, @User() user: any) {
    return this.deviceService.create(createDto, user);
  }

  @ApiOperation({ summary: '修改设备' })
  @RequirePermission('water-basic:device:edit')
  @Put()
  update(@Body() updateDto: any, @User() user: any) {
    return this.deviceService.update(updateDto, user);
  }

  @ApiOperation({ summary: '删除设备' })
  @RequirePermission('water-basic:device:remove')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deviceService.remove(+id);
  }

  @ApiOperation({ summary: '导出设备数据' })
  @RequirePermission('water-basic:device:export')
  @Post('export')
  export(@Res() res: Response, @Body() query: any, @User() user: any) {
    return this.deviceService.export(res, query, user);
  }

  @ApiOperation({ summary: '下载导入模板' })
  @Post('importTemplate')
  importTemplate(@Res() res: Response) {
    return this.deviceService.importTemplate(res);
  }

  @ApiOperation({ summary: '导入设备数据' })
  @RequirePermission('water-basic:device:import')
  @Post('importData')
  @UseInterceptors(FileInterceptor('file'))
  importData(@UploadedFile() file: Express.Multer.File, @User() user: any) {
    return this.deviceService.importData(file, user);
  }
}
