import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { PointService } from './point.service';
import { User, RequirePermission } from '@app/common';

@ApiTags('水务基础-测点管理')
@ApiBearerAuth()
@Controller('water-basic/point')
export class PointController {
  constructor(private readonly pointService: PointService) {}

  @ApiOperation({ summary: '获取测点列表' })
  @RequirePermission('water-basic:point:query')
  @Get('list')
  findList(@Query() query: any, @User() user: any) {
    return this.pointService.findList(query, user);
  }

  @ApiOperation({ summary: '查询测点详情' })
  @RequirePermission('water-basic:point:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pointService.findOne(+id);
  }

  @ApiOperation({ summary: '新增测点' })
  @RequirePermission('water-basic:point:add')
  @Post()
  create(@Body() createDto: any, @User() user: any) {
    return this.pointService.create(createDto, user);
  }

  @ApiOperation({ summary: '修改测点' })
  @RequirePermission('water-basic:point:edit')
  @Put()
  update(@Body() updateDto: any, @User() user: any) {
    return this.pointService.update(updateDto, user);
  }

  @ApiOperation({ summary: '删除测点' })
  @RequirePermission('water-basic:point:remove')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pointService.remove(+id);
  }

  @ApiOperation({ summary: '导出测点数据' })
  @RequirePermission('water-basic:point:export')
  @Post('export')
  export(@Res() res: Response, @Body() query: any, @User() user: any) {
    return this.pointService.export(res, query, user);
  }

  @ApiOperation({ summary: '下载导入模板' })
  @Post('importTemplate')
  importTemplate(@Res() res: Response) {
    return this.pointService.importTemplate(res);
  }

  @ApiOperation({ summary: '导入测点数据' })
  @RequirePermission('water-basic:point:import')
  @Post('importData')
  @UseInterceptors(FileInterceptor('file'))
  importData(@UploadedFile() file: Express.Multer.File, @User() user: any) {
    return this.pointService.importData(file, user);
  }

  @ApiOperation({ summary: '批量导入测点数据(前端解析)' })
  @RequirePermission('water-basic:point:import')
  @Post('importBatch')
  importBatch(@Body() dataList: any[], @User() user: any) {
    return this.pointService.importBatch(dataList, user);
  }
}
