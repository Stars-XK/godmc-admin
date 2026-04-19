import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'MICRO_AUTH',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('microservices.auth.host') || '127.0.0.1',
            port: config.get<number>('microservices.auth.port') || 3001,
          },
        }),
      },
      {
        name: 'MICRO_SYSTEM',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('microservices.system.host') || '127.0.0.1',
            port: config.get<number>('microservices.system.port') || 3002,
          },
        }),
      },
      {
        name: 'MICRO_MONITOR',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('microservices.monitor.host') || '127.0.0.1',
            port: config.get<number>('microservices.monitor.port') || 3003,
          },
        }),
      },
      {
        name: 'MICRO_UPLOAD',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('microservices.upload.host') || '127.0.0.1',
            port: config.get<number>('microservices.upload.port') || 3004,
          },
        }),
      },
      {
        name: 'MICRO_TOOLS',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('microservices.tools.host') || '127.0.0.1',
            port: config.get<number>('microservices.tools.port') || 3005,
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MicroservicesModule {}
