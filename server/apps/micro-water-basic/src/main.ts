import { NestFactory } from '@nestjs/core';
import { MicroWaterBasicModule } from './micro-water-basic.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MicroWaterBasicModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3006,
      },
    },
  );
  await app.listen();
}
bootstrap();
