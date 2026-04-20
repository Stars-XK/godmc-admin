import { NestFactory } from '@nestjs/core';
import { MicroMonitorModule } from './micro-monitor.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(MicroMonitorModule, {
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 3003,
    },
  });
  await app.listen();
}
bootstrap();
