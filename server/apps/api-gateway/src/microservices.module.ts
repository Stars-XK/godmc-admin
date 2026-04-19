import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MICRO_AUTH',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3001 },
      },
      {
        name: 'MICRO_SYSTEM',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3002 },
      },
      {
        name: 'MICRO_MONITOR',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3003 },
      },
      {
        name: 'MICRO_UPLOAD',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3004 },
      },
      {
        name: 'MICRO_TOOLS',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3005 },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MicroservicesModule {}
