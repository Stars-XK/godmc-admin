import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@app/shared';
import { Cron } from '@nestjs/schedule';
import * as os from 'os';

@Injectable()
export class RegistryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RegistryService.name);
  private serviceName: string;
  private servicePort: number;
  private serviceHost: string;
  private redisKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    this.serviceName = process.env.SERVICE_NAME || this.configService.get<string>('app.name') || 'unknown-service';
    this.servicePort = parseInt(process.env.SERVICE_PORT || this.configService.get<string>('app.port') || '0', 10);
    this.serviceHost = this.getIpAddress();
    this.redisKey = `microservice:${this.serviceName}:${this.serviceHost}:${this.servicePort}`;

    if (!this.servicePort) {
      this.logger.warn(`Service ${this.serviceName} has no port configured, skipping heartbeat registration`);
      return;
    }

    try {
      await this.sendHeartbeat();
      this.logger.log(`Initial heartbeat sent for ${this.serviceName} on ${this.serviceHost}:${this.servicePort}`);
    } catch (error) {
      this.logger.error(`Failed to send initial heartbeat for ${this.serviceName}: ${error.message}`, error.stack);
    }
  }

  onModuleDestroy() {
    if (this.redisKey) {
      this.redisService.getClient().del(this.redisKey).catch(err =>
        this.logger.error(`Failed to delete registry key on destroy: ${err.message}`)
      );
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
      await this.redisService.getClient().set(this.redisKey, JSON.stringify(payload), 'EX', 15);
    } catch (error) {
      this.logger.error(`Failed to send heartbeat for ${this.serviceName}: ${error.message}`, error.stack);
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