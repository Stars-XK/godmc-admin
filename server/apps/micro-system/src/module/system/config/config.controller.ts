import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConfigService } from './config.service';

@Controller()
export class SysConfigController {
  constructor(private readonly configService: ConfigService) {}

  @MessagePattern('system.config.create')
  create(@Payload() createConfigDto: any) {
    return this.configService.create(createConfigDto);
  }

  @MessagePattern('system.config.findAll')
  findAll(@Payload() query: any) {
    return this.configService.findAll(query);
  }

  @MessagePattern('system.config.findOne')
  findOne(@Payload() configId: any) {
    return this.configService.findOne(configId);
  }

  @MessagePattern('system.config.findOneByConfigKey')
  findOneByConfigKey(@Payload() configKey: any) {
    return this.configService.findOneByConfigKey(configKey);
  }

  @MessagePattern('system.config.getConfigValue')
  getConfigValue(@Payload() configKey: any) {
    return this.configService.getConfigValue(configKey);
  }

  @MessagePattern('system.config.update')
  update(@Payload() updateConfigDto: any) {
    return this.configService.update(updateConfigDto);
  }

  @MessagePattern('system.config.remove')
  remove(@Payload() configIds: any) {
    return this.configService.remove(configIds);
  }

  @MessagePattern('system.config.resetConfigCache')
  resetConfigCache() {
    return this.configService.resetConfigCache();
  }

  @MessagePattern('system.config.clearConfigCache')
  clearConfigCache() {
    return this.configService.clearConfigCache();
  }

  @MessagePattern('system.config.loadingConfigCache')
  loadingConfigCache() {
    return this.configService.loadingConfigCache();
  }

}
