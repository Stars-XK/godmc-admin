import { NestFactory } from '@nestjs/core';
import { MicroAuthModule } from './micro-auth.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MicroAuthModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.MICRO_AUTH_PORT || '3001', 10),
      },
    },
  );
  await app.listen();
}
bootstrap();