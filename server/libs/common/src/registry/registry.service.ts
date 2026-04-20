import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@app/shared';
import { Cron } from '@nestjs/schedule';
import * as os from 'os';

@Injectable()
export class RegistryService implements OnModuleInit, OnModuleDestroy {
  private serviceName: string;
  private servicePort: number;
  private serviceHost: string;
  private redisKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    // 优先从环境变量获取，如果没有则尝试从配置获取
    this.serviceName = process.env.SERVICE_NAME || this.configService.get<string>('app.name') || 'unknown-service';
    this.servicePort = parseInt(process.env.SERVICE_PORT || this.configService.get<string>('app.port') || '0', 10);
    this.serviceHost = this.getIpAddress();
    this.redisKey = `microservice:${this.serviceName}:${this.serviceHost}:${this.servicePort}`;
    
    // 启动时立即发送一次心跳
    this.sendHeartbeat();
  }

  onModuleDestroy() {
    // 服务关闭时主动删除注册信息
    if (this.redisKey) {
      this.redisService.getRedis().del(this.redisKey).catch(console.error);
    }
  }

  @Cron('*/10 * * * * *')
  async sendHeartbeat() {
    if (!this.servicePort) return; // 未配置端口的服务不注册
    
    const payload = {
      name: this.serviceName,
      host: this.serviceHost,
      port: this.servicePort,
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
      memoryUsage: process.memoryUsage().heapUsed,
    };

    try {
      // 写入 Redis 并设置 15 秒过期时间
      await this.redisService.getRedis().set(this.redisKey, JSON.stringify(payload), 'EX', 15);
    } catch (error) {
      console.error(`[RegistryService] Failed to send heartbeat for ${this.serviceName}`, error);
    }
  }

  private getIpAddress(): string {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      if (iface) {
        for (let i = 0; i < iface.length; i++) {
          const alias = iface[i];
          if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
            return alias.address;
          }
        }
      }
    }
    return '127.0.0.1';
  }
}