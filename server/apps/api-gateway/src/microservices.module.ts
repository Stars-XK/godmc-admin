import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'MICRO_AUTH',
        useFactory: () => ({
          transport: Transport.TCP,
          options: { host: process.env.MICRO_AUTH_HOST || '127.0.0.1', port: 5001 },
        }),
      },
      {
        name: 'MICRO_SYSTEM',
        useFactory: () => ({
          transport: Transport.TCP,
          options: { host: process.env.MICRO_SYSTEM_HOST || '127.0.0.1', port: 5002 },
        }),
      },
      {
        name: 'MICRO_MONITOR',
        useFactory: () => ({
          transport: Transport.TCP,
          options: { host: process.env.MICRO_MONITOR_HOST || '127.0.0.1', port: 5003 },
        }),
      },
      {
        name: 'MICRO_UPLOAD',
        useFactory: () => ({
          transport: Transport.TCP,
          options: { host: process.env.MICRO_UPLOAD_HOST || '127.0.0.1', port: 5004 },
        }),
      },
      {
        name: 'MICRO_TOOLS',
        useFactory: () => ({
          transport: Transport.TCP,
          options: { host: process.env.MICRO_TOOLS_HOST || '127.0.0.1', port: 5005 },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MicroservicesModule {}
