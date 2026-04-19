import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { Repository, In } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { CacheEnum } from '@app/common/enum/index';
import { ExportTable } from '@app/common/utils/export';
import { SysDictTypeEntity } from '@app/common';
import { SysDictDataEntity } from '@app/common';
import { CreateDictTypeDto, UpdateDictTypeDto, ListDictType, CreateDictDataDto, UpdateDictDataDto, ListDictData } from './dto/index';
import { RedisService } from '@app/common/shared/redis/redis.service';
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class DictService {
    constructor(@Inject('MICRO_SYSTEM') private readonly client: ClientProxy) {
    }

  async createType(CreateDictTypeDto: CreateDictTypeDto) {
      return firstValueFrom(this.client.send('system.dict.createType', CreateDictTypeDto));
  }

  async deleteType(dictIds: number[]) {
      return firstValueFrom(this.client.send('system.dict.deleteType', dictIds));
  }

  async updateType(updateDictTypeDto: UpdateDictTypeDto) {
      return firstValueFrom(this.client.send('system.dict.updateType', updateDictTypeDto));
  }

  async findAllType(query: ListDictType) {
      return firstValueFrom(this.client.send('system.dict.findAllType', query));
  }

  async findOneType(dictId: number) {
      return firstValueFrom(this.client.send('system.dict.findOneType', dictId));
  }

  async findOptionselect() {
      return firstValueFrom(this.client.send('system.dict.findOptionselect', {}));
  }

  // 字典数据
  async createDictData(createDictDataDto: CreateDictDataDto) {
      return firstValueFrom(this.client.send('system.dict.createDictData', createDictDataDto));
  }

  async deleteDictData(dictIds: number[]) {
      return firstValueFrom(this.client.send('system.dict.deleteDictData', dictIds));
  }

  async updateDictData(updateDictDataDto: UpdateDictDataDto) {
      return firstValueFrom(this.client.send('system.dict.updateDictData', updateDictDataDto));
  }

  async findAllData(query: ListDictData) {
      return firstValueFrom(this.client.send('system.dict.findAllData', query));
  }

  /**
   * 根据字典类型查询一个数据类型的信息。
   *
   * @param dictType 字典类型字符串。
   * @returns 返回查询到的数据类型信息，如果未查询到则返回空。
   */
  async findOneDataType(dictType: string) {
      return firstValueFrom(this.client.send('system.dict.findOneDataType', dictType));
  }

  async findOneDictData(dictCode: number) {
      return firstValueFrom(this.client.send('system.dict.findOneDictData', dictCode));
  }

  /**
   * 导出字典数据为xlsx文件
   * @param res
   */
  async export(res: Response, body: ListDictType) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAllType(body);
    const options = {
      sheetName: '字典数据',
      data: list.data.list,
      header: [
        { title: '字典主键', dataIndex: 'dictId' },
        { title: '字典名称', dataIndex: 'dictName' },
        { title: '字典类型', dataIndex: 'dictType' },
        { title: '状态', dataIndex: 'status' },
      ],
    };
    ExportTable(options, res);
  }

  /**
   * 导出字典数据为xlsx文件
   * @param res
   */
  async exportData(res: Response, body: ListDictType) {
      return firstValueFrom(this.client.send('system.dict.exportData', { res, body }));
  }

  /**
   * 刷新字典缓存
   * @returns
   */
  async resetDictCache() {
      return firstValueFrom(this.client.send('system.dict.resetDictCache', {}));
  }

  /**
   * 删除字典缓存
   * @returns
   */
  async clearDictCache() {
      return firstValueFrom(this.client.send('system.dict.clearDictCache', {}));
  }

  /**
   * 加载字典缓存
   * @returns
   */
  async loadingDictCache() {
      return firstValueFrom(this.client.send('system.dict.loadingDictCache', {}));
  }
}
