import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MICRO_SYSTEM',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_SYSTEM_HOST || '127.0.0.1', port: 3002 },
      },
      {
        name: 'MICRO_WATER_BASIC',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_WATER_BASIC_HOST || '127.0.0.1', port: 3006 },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MicroservicesModule {}

