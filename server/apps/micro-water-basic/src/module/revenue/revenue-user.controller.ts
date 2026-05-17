import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { User } from '@app/common/decorators/user.decorator';
import { RevenueUserService } from './revenue-user.service';
import { Response } from 'express';

@ApiTags('营收基础信息')
@ApiBearerAuth()
@Controller('water-basic/revenue-user')
export class RevenueUserController {
  constructor(private readonly revenueUserService: RevenueUserService) {}

  @ApiOperation({ summary: '查询营收用户列表' })
  @RequirePermission('water-basic:revenue:query')
  @Get('list')
  list(@Query() query: any, @User() user: any) {
    return this.revenueUserService.findList(query, user);
  }

  @ApiOperation({ summary: '获取营收用户详细信息' })
  @RequirePermission('water-basic:revenue:query')
  @Get(':id')
  getInfo(@Param('id') id: string) {
    return this.revenueUserService.findOne(+id);
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
    return this.revenueUserService.remove(ids.split(',').map(Number));
  }

  @ApiOperation({ summary: '批量导入营收用户数据(前端解析)' })
  @RequirePermission('water-basic:revenue:import')
  @Post('importBatch')
  importBatch(@Body() dataList: any[], @User() user: any) {
    return this.revenueUserService.importBatch(dataList, user);
  }

  @ApiOperation({ summary: '下载导入模板' })
  @Post('importTemplate')
  importTemplate(@Res() res: Response) {
    return this.revenueUserService.importTemplate(res);
  }

  @ApiOperation({ summary: '导入营收用户数据(文件上传)' })
  @RequirePermission('water-basic:revenue:import')
  @Post('importData')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  importData(@UploadedFile() file: Express.Multer.File, @User() user: any) {
    return this.revenueUserService.importData(file, user);
  }

  @ApiOperation({ summary: '导出营收用户数据' })
  @RequirePermission('water-basic:revenue:export')
  @Post('export')
  export(@Res() res: Response, @Body() query: any, @User() user: any) {
    return this.revenueUserService.export(res, query, user);
  }
}
