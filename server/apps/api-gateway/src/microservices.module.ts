import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MICRO_AUTH',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_AUTH_HOST || '127.0.0.1', port: 5001 },
      },
      {
        name: 'MICRO_SYSTEM',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_SYSTEM_HOST || '127.0.0.1', port: 5002 },
      },
      {
        name: 'MICRO_MONITOR',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_MONITOR_HOST || '127.0.0.1', port: 5003 },
      },
      {
        name: 'MICRO_UPLOAD',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_UPLOAD_HOST || '127.0.0.1', port: 5004 },
      },
      {
        name: 'MICRO_TOOLS',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_TOOLS_HOST || '127.0.0.1', port: 5005 },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MicroservicesModule {}
