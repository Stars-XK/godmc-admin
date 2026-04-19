import { NestFactory } from '@nestjs/core';
import { MicroUploadModule } from './micro-upload.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(MicroUploadModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: configService.get<string>('microservices.upload.host') || '127.0.0.1',
      port: configService.get<number>('microservices.upload.port') || 3004,
    },
  });

  await app.startAllMicroservices();
  await app.init();
}
bootstrap();
