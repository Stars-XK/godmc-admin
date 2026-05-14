import { Controller, Get, Post, Put, Delete, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ResultData } from '@app/common/utils/result';
import { ReportCenterService } from './report-center.service';

@ApiTags('专题报告中心')
@Controller('system/report-center')
export class ReportCenterController {
  constructor(private readonly reportService: ReportCenterService) {}

  @ApiOperation({ summary: '查询报告列表' })
  @ApiQuery({ name: 'pageNum', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'reportType', required: false, description: '报告类型' })
  @ApiQuery({ name: 'keyword', required: false, description: '标题/标签搜索' })
  @Get('list')
  async list(
    @Query('pageNum') pageNum?: number,
    @Query('pageSize') pageSize?: number,
    @Query('reportType') reportType?: string,
    @Query('keyword') keyword?: string,
  ) {
    try {
      const data = await this.reportService.list({
        pageNum: Number(pageNum) || 1,
        pageSize: Number(pageSize) || 10,
        reportType,
        keyword,
      });
      return ResultData.ok(data);
    } catch (e) {
      return ResultData.fail(500, e.message);
    }
  }

  @ApiOperation({ summary: '获取报告详情' })
  @Get(':id')
  async getById(@Param('id') id: number) {
    try {
      const data = await this.reportService.getById(id);
      if (!data) return ResultData.fail(404, '报告不存在');
      return ResultData.ok(data);
    } catch (e) {
      return ResultData.fail(500, e.message);
    }
  }

  @ApiOperation({ summary: '生成专题报告' })
  @ApiQuery({ name: 'reportType', required: true, description: '报告类型(monthly_ops/device_ops/alarm_analysis/zone_water/custom)' })
  @ApiQuery({ name: 'reportPeriod', required: true, description: '报告周期(YYYY-MM或YYYY-MM-DD)' })
  @ApiQuery({ name: 'title', required: false, description: '自定义标题' })
  @Post('generate')
  async generate(
    @Query('reportType') reportType: string,
    @Query('reportPeriod') reportPeriod: string,
    @Query('title') title?: string,
  ) {
    if (!reportType || !reportPeriod) {
      return ResultData.fail(500, '必须提供 reportType 和 reportPeriod');
    }
    try {
      const data = await this.reportService.generate(reportType, reportPeriod, title);
      return ResultData.ok(data);
    } catch (e) {
      return ResultData.fail(500, e.message);
    }
  }

  @ApiOperation({ summary: '更新报告内容' })
  @Put(':id')
  async update(@Param('id') id: number, @Body() body: any) {
    try {
      const data = await this.reportService.update(id, body);
      return ResultData.ok(data, '更新成功');
    } catch (e) {
      return ResultData.fail(500, e.message);
    }
  }

  @ApiOperation({ summary: '删除报告' })
  @Delete(':id')
  async delete(@Param('id') id: number) {
    try {
      await this.reportService.delete(id);
      return ResultData.ok(null, '删除成功');
    } catch (e) {
      return ResultData.fail(500, e.message);
    }
  }
}
