import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MICRO_AUTH',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_AUTH_HOST || '127.0.0.1', port: parseInt(process.env.MICRO_AUTH_PORT || '3001', 10) },
      },
      {
        name: 'MICRO_SYSTEM',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_SYSTEM_HOST || '127.0.0.1', port: parseInt(process.env.MICRO_SYSTEM_PORT || '3002', 10) },
      },
      {
        name: 'MICRO_MONITOR',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_MONITOR_HOST || '127.0.0.1', port: parseInt(process.env.MICRO_MONITOR_PORT || '3003', 10) },
      },
      {
        name: 'MICRO_UPLOAD',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_UPLOAD_HOST || '127.0.0.1', port: parseInt(process.env.MICRO_UPLOAD_PORT || '3004', 10) },
      },
      {
        name: 'MICRO_TOOLS',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_TOOLS_HOST || '127.0.0.1', port: parseInt(process.env.MICRO_TOOLS_PORT || '3005', 10) },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MicroservicesModule {}
