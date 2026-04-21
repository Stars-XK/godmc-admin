import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StationService } from './station.service';
import { User, RequirePermission } from '@app/common';

@ApiTags('水务基础-站点管理')
@ApiBearerAuth()
@Controller('water-basic/station')
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @ApiOperation({ summary: '获取站点列表' })
  @RequirePermission('water-basic:station:query')
  @Get('list')
  findList(@Query() query: any, @User() user: any) {
    return this.stationService.findList(query, user);
  }

  @ApiOperation({ summary: '查询站点详情' })
  @RequirePermission('water-basic:station:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stationService.findOne(+id);
  }

  @ApiOperation({ summary: '新增站点' })
  @RequirePermission('water-basic:station:add')
  @Post()
  create(@Body() createDto: any, @User() user: any) {
    return this.stationService.create(createDto, user);
  }

  @ApiOperation({ summary: '修改站点' })
  @RequirePermission('water-basic:station:edit')
  @Put()
  update(@Body() updateDto: any, @User() user: any) {
    return this.stationService.update(updateDto, user);
  }

  @ApiOperation({ summary: '删除站点' })
  @RequirePermission('water-basic:station:remove')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stationService.remove(+id);
  }

  @ApiOperation({ summary: '导出站点数据' })
  @RequirePermission('water-basic:station:export')
  @Post('export')
  export(@Res() res: Response, @Body() query: any, @User() user: any) {
    return this.stationService.export(res, query, user);
  }

  @ApiOperation({ summary: '下载导入模板' })
  @Post('importTemplate')
  importTemplate(@Res() res: Response) {
    return this.stationService.importTemplate(res);
  }

  @ApiOperation({ summary: '导入站点数据' })
  @RequirePermission('water-basic:station:import')
  @Post('importData')
  @UseInterceptors(FileInterceptor('file'))
  importData(@UploadedFile() file: Express.Multer.File, @User() user: any) {
    return this.stationService.importData(file, user);
  }
}
