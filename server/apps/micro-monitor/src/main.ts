import { NestFactory } from '@nestjs/core';
import { MicroMonitorModule } from './micro-monitor.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(MicroMonitorModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: configService.get<string>('microservices.monitor.host') || '127.0.0.1',
      port: configService.get<number>('microservices.monitor.port') || 3003,
    },
  });

  await app.startAllMicroservices();
  await app.init();
}
bootstrap();
