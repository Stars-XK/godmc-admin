import { Injectable, Inject } from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { ExportTable } from '@app/common/utils/export';
import { CreateConfigDto, UpdateConfigDto, ListConfigDto } from './dto/index';
import { SysConfigEntity } from '@app/common';
import { RedisService } from '@app/common/shared/redis/redis.service';
import { CacheEnum } from '@app/common/enum/index';
import { Cacheable, CacheEvict } from '@app/common/decorators/redis.decorator';
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ConfigService {
    constructor(@Inject('MICRO_SYSTEM') private readonly client: ClientProxy) {
    }

  async create(createConfigDto: CreateConfigDto) {
      return firstValueFrom(this.client.send('system.config.create', createConfigDto));
  }

  async findAll(query: ListConfigDto) {
      return firstValueFrom(this.client.send('system.config.findAll', query));
  }

  async findOne(configId: number) {
      return firstValueFrom(this.client.send('system.config.findOne', configId));
  }

  async findOneByConfigKey(configKey: string) {
      return firstValueFrom(this.client.send('system.config.findOneByConfigKey', configKey));
  }

  /**
   * 根据配置键值异步查找一条配置信息。
   *
   * @param configKey 配置的键值，用于查询配置信息。
   * @returns 返回一个结果对象，包含查询到的配置信息。如果未查询到，则返回空结果。
   */
  @Cacheable(CacheEnum.SYS_CONFIG_KEY, '{configKey}')
  async getConfigValue(configKey: string) {
      return firstValueFrom(this.client.send('system.config.getConfigValue', configKey));
  }

  @CacheEvict(CacheEnum.SYS_CONFIG_KEY, '{updateConfigDto.configKey}')
  async update(updateConfigDto: UpdateConfigDto) {
      return firstValueFrom(this.client.send('system.config.update', updateConfigDto));
  }

  async remove(configIds: number[]) {
      return firstValueFrom(this.client.send('system.config.remove', configIds));
  }

  /**
   * 导出参数管理数据为xlsx
   * @param res
   */
  async export(res: Response, body: ListConfigDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '参数管理',
      data: list.data.list,
      header: [
        { title: '参数主键', dataIndex: 'configId' },
        { title: '参数名称', dataIndex: 'configName' },
        { title: '参数键名', dataIndex: 'configKey' },
        { title: '参数键值', dataIndex: 'configValue' },
        { title: '系统内置', dataIndex: 'configType' },
      ],
      dictMap: {
        configType: {
          Y: '是',
          N: '否',
        },
      },
    };
    ExportTable(options, res);
  }

  /**
   * 刷新系统配置缓存
   * @returns
   */
  async resetConfigCache() {
      return firstValueFrom(this.client.send('system.config.resetConfigCache', {}));
  }

  /**
   * 删除系统配置缓存
   * @returns
   */
  @CacheEvict(CacheEnum.SYS_CONFIG_KEY, '*')
  async clearConfigCache() {
      return firstValueFrom(this.client.send('system.config.clearConfigCache', {}));
  }

  /**
   * 加载系统配置缓存
   * @returns
   */
  async loadingConfigCache() {
      return firstValueFrom(this.client.send('system.config.loadingConfigCache', {}));
  }
}
