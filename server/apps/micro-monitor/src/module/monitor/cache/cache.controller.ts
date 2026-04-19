import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CacheService } from './cache.service';

@Controller()
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @MessagePattern('monitor.cache.getInfo')
  getInfo() {
    return this.cacheService.getInfo();
  }

  @MessagePattern('monitor.cache.getNames')
  getNames() {
    return this.cacheService.getNames();
  }

  @MessagePattern('monitor.cache.getKeys')
  getKeys(@Payload() id: string) {
    return this.cacheService.getKeys(id);
  }

  @MessagePattern('monitor.cache.getValue')
  getValue(@Payload() params: any) {
    return this.cacheService.getValue(params);
  }

  @MessagePattern('monitor.cache.clearCacheName')
  clearCacheName(@Payload() cacheName: string) {
    return this.cacheService.clearCacheName(cacheName);
  }

  @MessagePattern('monitor.cache.clearCacheKey')
  clearCacheKey(@Payload() cacheKey: string) {
    return this.cacheService.clearCacheKey(cacheKey);
  }

  @MessagePattern('monitor.cache.clearCacheAll')
  clearCacheAll() {
    return this.cacheService.clearCacheAll();
  }
}
