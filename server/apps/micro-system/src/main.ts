import { NestFactory } from '@nestjs/core';
import { MicroSystemModule } from './micro-system.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(MicroSystemModule);
  const configService = app.get<ConfigService>(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: configService.get<string>('microservices.system.host') || '127.0.0.1',
      port: configService.get<number>('microservices.system.port') || 3002,
    },
  });

  await app.startAllMicroservices();
  await app.init();
}
bootstrap();
