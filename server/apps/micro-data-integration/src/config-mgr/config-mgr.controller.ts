import { Controller, Get, Post, Body, Put, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigMgrService } from './config-mgr.service';
import { DataIntegrationSourceEntity, DataIntegrationTaskEntity, DataIntegrationMappingEntity } from '@app/common';

@ApiTags('数据接入配置管理')
@Controller('data-integration/config')
export class ConfigMgrController {
  constructor(private readonly configService: ConfigMgrService) {}

  @ApiOperation({ summary: '获取数据源列表' })
  @Get('source/list')
  sourceList() {
    return this.configService.sourceList();
  }

  @ApiOperation({ summary: '新增数据源' })
  @Post('source')
  sourceAdd(@Body() body: Partial<DataIntegrationSourceEntity>) {
    return this.configService.sourceAdd(body);
  }

  @ApiOperation({ summary: '修改数据源' })
  @Put('source')
  sourceUpdate(@Body() body: Partial<DataIntegrationSourceEntity>) {
    return this.configService.sourceUpdate(body);
  }

  @ApiOperation({ summary: '删除数据源' })
  @Delete('source/:id')
  sourceDelete(@Param('id') id: number) {
    return this.configService.sourceDelete(id);
  }

  @ApiOperation({ summary: '测试数据源连接' })
  @Post('source/test')
  testConnection(@Body() body: Partial<DataIntegrationSourceEntity>) {
    return this.configService.testConnection(body);
  }

  @ApiOperation({ summary: '获取任务列表' })
  @Get('task/list')
  taskList(@Query('sourceId') sourceId?: number) {
    return this.configService.taskList(sourceId);
  }

  @ApiOperation({ summary: '新增任务' })
  @Post('task')
  taskAdd(@Body() body: Partial<DataIntegrationTaskEntity>) {
    return this.configService.taskAdd(body);
  }

  @ApiOperation({ summary: '修改任务' })
  @Put('task')
  taskUpdate(@Body() body: Partial<DataIntegrationTaskEntity>) {
    return this.configService.taskUpdate(body);
  }

  @ApiOperation({ summary: '删除任务' })
  @Delete('task/:id')
  taskDelete(@Param('id') id: number) {
    return this.configService.taskDelete(id);
  }

  @ApiOperation({ summary: '获取任务字段映射列表' })
  @Get('mapping/list')
  mappingList(@Query('taskId') taskId: number) {
    return this.configService.mappingList(taskId);
  }

  @ApiOperation({ summary: '批量保存任务字段映射' })
  @Post('mapping/batch/:taskId')
  mappingSaveBatch(@Param('taskId') taskId: number, @Body() body: { mappings: Partial<DataIntegrationMappingEntity>[] }) {
    return this.configService.mappingSaveBatch(taskId, body.mappings);
  }

  @ApiOperation({ summary: '获取系统本地表列表' })
  @Get('local/tables')
  getLocalTables() {
    return this.configService.getLocalTables();
  }

  @ApiOperation({ summary: '获取系统本地表字段列表' })
  @Get('local/columns/:tableName')
  getLocalColumns(@Param('tableName') tableName: string) {
    return this.configService.getLocalColumns(tableName);
  }
}