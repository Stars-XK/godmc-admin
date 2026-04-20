import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZoneService } from './zone.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { User } from '@app/common/decorators/user.decorator';

@ApiTags('水务基础-分区管理')
@ApiBearerAuth()
@Controller('zone')
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

  @ApiOperation({ summary: '导出分区数据' })
  @RequirePermission('water-basic:zone:export')
  @Post('export')
  export(@Res() res: Response, @Body() query: any, @User() user: any) {
    return this.zoneService.export(res, query, user);
  }

  @ApiOperation({ summary: '下载导入模板' })
  @Get('importTemplate')
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
}
