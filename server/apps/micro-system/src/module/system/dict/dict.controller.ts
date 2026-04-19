import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DictService } from './dict.service';

@Controller()
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @MessagePattern('system.dict.createType')
  createType(@Payload() CreateDictTypeDto: any) {
    return this.dictService.createType(CreateDictTypeDto);
  }

  @MessagePattern('system.dict.deleteType')
  deleteType(@Payload() dictIds: any) {
    return this.dictService.deleteType(dictIds);
  }

  @MessagePattern('system.dict.updateType')
  updateType(@Payload() updateDictTypeDto: any) {
    return this.dictService.updateType(updateDictTypeDto);
  }

  @MessagePattern('system.dict.findAllType')
  findAllType(@Payload() query: any) {
    return this.dictService.findAllType(query);
  }

  @MessagePattern('system.dict.findOneType')
  findOneType(@Payload() dictId: any) {
    return this.dictService.findOneType(dictId);
  }

  @MessagePattern('system.dict.findOptionselect')
  findOptionselect() {
    return this.dictService.findOptionselect();
  }

  @MessagePattern('system.dict.createDictData')
  createDictData(@Payload() createDictDataDto: any) {
    return this.dictService.createDictData(createDictDataDto);
  }

  @MessagePattern('system.dict.deleteDictData')
  deleteDictData(@Payload() dictIds: any) {
    return this.dictService.deleteDictData(dictIds);
  }

  @MessagePattern('system.dict.updateDictData')
  updateDictData(@Payload() updateDictDataDto: any) {
    return this.dictService.updateDictData(updateDictDataDto);
  }

  @MessagePattern('system.dict.findAllData')
  findAllData(@Payload() query: any) {
    return this.dictService.findAllData(query);
  }

  @MessagePattern('system.dict.findOneDataType')
  findOneDataType(@Payload() dictType: any) {
    return this.dictService.findOneDataType(dictType);
  }

  @MessagePattern('system.dict.findOneDictData')
  findOneDictData(@Payload() dictCode: any) {
    return this.dictService.findOneDictData(dictCode);
  }

  @MessagePattern('system.dict.exportData')
  exportData(@Payload() payload: any) {
    return this.dictService.exportData(payload.res, payload.body);
  }

  @MessagePattern('system.dict.resetDictCache')
  resetDictCache() {
    return this.dictService.resetDictCache();
  }

  @MessagePattern('system.dict.clearDictCache')
  clearDictCache() {
    return this.dictService.clearDictCache();
  }

  @MessagePattern('system.dict.loadingDictCache')
  loadingDictCache() {
    return this.dictService.loadingDictCache();
  }

}
