import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CacheService {
  constructor(@Inject('MICRO_MONITOR') private readonly client: ClientProxy) {}

  async getInfo() {
    return firstValueFrom(this.client.send('monitor.cache.getInfo', {}));
  }

  async getNames() {
    return firstValueFrom(this.client.send('monitor.cache.getNames', {}));
  }

  async getKeys(id: string) {
    return firstValueFrom(this.client.send('monitor.cache.getKeys', id));
  }

  async getValue(params: any) {
    return firstValueFrom(this.client.send('monitor.cache.getValue', params));
  }

  async clearCacheName(cacheName: string) {
    return firstValueFrom(this.client.send('monitor.cache.clearCacheName', cacheName));
  }

  async clearCacheKey(cacheKey: string) {
    return firstValueFrom(this.client.send('monitor.cache.clearCacheKey', cacheKey));
  }

  async clearCacheAll() {
    return firstValueFrom(this.client.send('monitor.cache.clearCacheAll', {}));
  }
}
