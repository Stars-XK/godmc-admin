import { Controller, Get, Post, Body, Param, Delete, Request, Query, Put, Res, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TableName, GenDbTableList, GenTableList, GenTableUpdate } from './dto/create-genTable-dto';
import { Response } from 'express';
import { User, UserDto } from '../user/user.decorator';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import * as fs from 'fs-extra';
import * as path from 'path';

@ApiTags('系统工具')
@Controller('tool')
@ApiBearerAuth('Authorization')
export class ToolController {
  constructor(@Inject('MICRO_TOOLS') private readonly toolClient: ClientProxy) {}

  @ApiOperation({ summary: '数据表列表' })
  @Get('/gen/list')
  findAll(@Query() query: GenTableList) {
    return this.toolClient.send('tool.findAll', query);
  }
  @ApiOperation({ summary: '查询数据库列表' })
  @Get('/gen/db/list')
  genDbList(@Query() query: GenDbTableList) {
    return this.toolClient.send('tool.genDbList', query);
  }

  @ApiOperation({ summary: '导入表' })
  @Post('/gen/importTable')
  genImportTable(@Body() table: TableName, @User() user: UserDto) {
    return this.toolClient.send('tool.importTable', { table, user });
  }

  @ApiOperation({ summary: '同步表' })
  @Get('/gen/synchDb/:tableName')
  synchDb(@Param('tableName') tableName: string) {
    return this.toolClient.send('tool.synchDb', tableName);
  }

  @ApiOperation({ summary: '查询表详细信息' })
  @Get('/gen/:id')
  gen(@Param('id') id: string) {
    return this.toolClient.send('tool.gen', id);
  }

  @ApiOperation({ summary: '修改代码生成信息' })
  @Put('/gen')
  genUpdate(@Body() genTableUpdate: GenTableUpdate) {
    return this.toolClient.send('tool.genUpdate', genTableUpdate);
  }

  @ApiOperation({ summary: '删除表数据' })
  @Delete('/gen/:id')
  remove(@Param('id') id: string) {
    return this.toolClient.send('tool.remove', id);
  }

  @ApiOperation({ summary: '生成代码' })
  @Get('/gen/batchGenCode/zip')
  async batchGenCode(@Query() tables: TableName, @Res() res: Response) {
    const zipBufferData = await lastValueFrom(this.toolClient.send('tool.batchGenCode', tables));
    const zipBuffer = Buffer.from(zipBufferData.data || zipBufferData);
    
    const zipFilePath = path.posix.join(__dirname, 'temp.zip');
    await fs.writeFile(zipFilePath, zipBuffer);
    
    res.download(zipFilePath, 'download.zip', async (err) => {
      if (!err) await fs.remove(zipFilePath);
      else res.status(500).send('Error downloading file');
    });
  }

  @ApiOperation({ summary: '查看代码' })
  @Get('/gen/preview/:id')
  preview(@Param('id') id: string) {
    return this.toolClient.send('tool.preview', id);
  }
}
