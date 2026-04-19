import { NestFactory } from '@nestjs/core';
import { MicroToolsModule } from './micro-tools.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(MicroToolsModule);
  const configService = app.get<ConfigService>(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: configService.get<string>('microservices.tools.host') || '127.0.0.1',
      port: configService.get<number>('microservices.tools.port') || 3005,
    },
  });

  await app.startAllMicroservices();
  await app.init();
}
bootstrap();
