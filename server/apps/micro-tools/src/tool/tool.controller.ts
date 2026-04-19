import { Controller } from '@nestjs/common';
import { ToolService } from './tool.service';
import { TableName, GenDbTableList, GenTableList, GenTableUpdate } from './dto/create-genTable-dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class ToolController {
  constructor(private readonly toolService: ToolService) {}

  @MessagePattern('tool.findAll')
  findAll(@Payload() query: GenTableList) {
    return this.toolService.findAll(query);
  }

  @MessagePattern('tool.genDbList')
  genDbList(@Payload() query: GenDbTableList) {
    return this.toolService.genDbList(query);
  }

  @MessagePattern('tool.importTable')
  genImportTable(@Payload() data: { table: TableName; user: any }) {
    return this.toolService.importTable(data.table, data.user);
  }

  @MessagePattern('tool.synchDb')
  synchDb(@Payload() tableName: string) {
    return this.toolService.synchDb(tableName);
  }

  @MessagePattern('tool.gen')
  gen(@Payload() id: string) {
    return this.toolService.findOne(+id);
  }

  @MessagePattern('tool.genUpdate')
  genUpdate(@Payload() genTableUpdate: GenTableUpdate) {
    return this.toolService.genUpdate(genTableUpdate);
  }

  @MessagePattern('tool.remove')
  remove(@Payload() id: string) {
    return this.toolService.remove(+id);
  }

  @MessagePattern('tool.batchGenCode')
  batchGenCode(@Payload() tables: TableName) {
    return this.toolService.batchGenCode(tables);
  }

  @MessagePattern('tool.preview')
  preview(@Payload() id: string) {
    return this.toolService.preview(+id);
  }
}
