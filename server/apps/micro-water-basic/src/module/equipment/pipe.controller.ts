import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { PipeService } from './pipe.service';
import { User, RequirePermission } from '@app/common';

@ApiTags('水务基础-管网管线管理')
@ApiBearerAuth()
@Controller('water-basic/pipe')
export class PipeController {
  constructor(private readonly pipeService: PipeService) {}

  @ApiOperation({ summary: '获取管网管线列表' })
  @RequirePermission('water-basic:pipe:query')
  @Get('list')
  findList(@Query() query: any, @User() user: any) {
    return this.pipeService.findList(query, user);
  }

  @ApiOperation({ summary: '查询管网管线详情' })
  @RequirePermission('water-basic:pipe:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pipeService.findOne(+id);
  }

  @ApiOperation({ summary: '新增管网管线' })
  @RequirePermission('water-basic:pipe:add')
  @Post()
  create(@Body() createDto: any, @User() user: any) {
    return this.pipeService.create(createDto, user);
  }

  @ApiOperation({ summary: '修改管网管线' })
  @RequirePermission('water-basic:pipe:edit')
  @Put()
  update(@Body() updateDto: any, @User() user: any) {
    return this.pipeService.update(updateDto, user);
  }

  @ApiOperation({ summary: '删除管网管线' })
  @RequirePermission('water-basic:pipe:remove')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pipeService.remove(+id);
  }

  @ApiOperation({ summary: '导出管网管线数据' })
  @RequirePermission('water-basic:pipe:export')
  @Post('export')
  export(@Res() res: Response, @Body() query: any, @User() user: any) {
    return this.pipeService.export(res, query, user);
  }

  @ApiOperation({ summary: '下载导入模板' })
  @Post('importTemplate')
  importTemplate(@Res() res: Response) {
    return this.pipeService.importTemplate(res);
  }

  @ApiOperation({ summary: '导入管网管线数据' })
  @RequirePermission('water-basic:pipe:import')
  @Post('importData')
  @UseInterceptors(FileInterceptor('file'))
  importData(@UploadedFile() file: Express.Multer.File, @User() user: any) {
    return this.pipeService.importData(file, user);
  }

  @ApiOperation({ summary: '批量导入管网管线数据(前端解析)' })
  @RequirePermission('water-basic:pipe:import')
  @Post('importBatch')
  importBatch(@Body() dataList: any[], @User() user: any) {
    return this.pipeService.importBatch(dataList, user);
  }
}
