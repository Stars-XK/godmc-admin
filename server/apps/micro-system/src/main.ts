import { NestFactory } from '@nestjs/core';
import { MicroSystemModule } from './micro-system.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MicroSystemModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.MICRO_SYSTEM_PORT || '3002', 10),
      },
    },
  );
  await app.listen();
}
bootstrap();
