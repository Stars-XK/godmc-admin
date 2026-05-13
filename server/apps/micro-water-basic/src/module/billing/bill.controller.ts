import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { BillService } from './bill.service';
import { User, RequirePermission } from '@app/common';

@ApiTags('水务基础-水费账单管理')
@ApiBearerAuth()
@Controller('water-basic/billing')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @ApiOperation({ summary: '获取水费账单列表' })
  @RequirePermission('water-basic:billing:query')
  @Get('list')
  findList(@Query() query: any, @User() user: any) {
    return this.billService.findList(query, user);
  }

  @ApiOperation({ summary: '查询水费账单详情' })
  @RequirePermission('water-basic:billing:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billService.findOne(+id);
  }

  @ApiOperation({ summary: '新增水费账单' })
  @RequirePermission('water-basic:billing:add')
  @Post()
  create(@Body() createDto: any, @User() user: any) {
    return this.billService.create(createDto, user);
  }

  @ApiOperation({ summary: '修改水费账单' })
  @RequirePermission('water-basic:billing:edit')
  @Put()
  update(@Body() updateDto: any, @User() user: any) {
    return this.billService.update(updateDto, user);
  }

  @ApiOperation({ summary: '删除水费账单' })
  @RequirePermission('water-basic:billing:remove')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.billService.remove(+id);
  }

  @ApiOperation({ summary: '导出水费账单' })
  @RequirePermission('water-basic:billing:export')
  @Post('export')
  export(@Res() res: Response, @Body() query: any, @User() user: any) {
    return this.billService.export(res, query, user);
  }
}
