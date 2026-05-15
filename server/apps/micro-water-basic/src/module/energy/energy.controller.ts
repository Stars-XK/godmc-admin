import { Controller, Get, Post, Delete, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EnergyService } from './energy.service';
import { ResultData } from '@app/common/utils/result';

@ApiTags('能耗分析')
@Controller('water-basic/energy')
export class EnergyController {
  constructor(private readonly service: EnergyService) {}

  @ApiOperation({ summary: '能耗记录列表' })
  @ApiQuery({ name: 'pageNum', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'stationCode', required: false })
  @ApiQuery({ name: 'periodType', required: false })
  @Get('list')
  async list(@Query() q: any) {
    return this.service.list(q);
  }

  @ApiOperation({ summary: '能耗汇总统计' })
  @ApiQuery({ name: 'period', required: false, description: '月份(YYYY-MM)' })
  @Get('summary')
  async summary(@Query('period') period?: string) {
    return this.service.getSummary(period);
  }

  @ApiOperation({ summary: '新增能耗记录' })
  @Post()
  async create(@Body() body: any) {
    try {
      const data = await this.service.create(body);
      return ResultData.ok(data, '新增成功');
    } catch (e) {
      return ResultData.fail(500, e.message);
    }
  }

  @ApiOperation({ summary: '删除能耗记录' })
  @Delete(':id')
  async delete(@Param('id') id: number) {
    await this.service.delete(id);
    return ResultData.ok(null, '删除成功');
  }
}
