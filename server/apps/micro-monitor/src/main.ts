import { NestFactory } from '@nestjs/core';
import { MicroMonitorModule } from './micro-monitor.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(MicroMonitorModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: parseInt(process.env.MICRO_MONITOR_PORT || '3003', 10),
    },
  });
  await app.listen();
}
bootstrap();
