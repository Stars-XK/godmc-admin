import { NestFactory } from '@nestjs/core';
import { MicroAuthModule } from './micro-auth.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(MicroAuthModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: configService.get<string>('microservices.auth.host') || '0.0.0.0',
      port: configService.get<number>('microservices.auth.port') || 3001,
    },
  });

  await app.startAllMicroservices();
  await app.init();
}
bootstrap();