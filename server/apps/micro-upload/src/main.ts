import { NestFactory } from '@nestjs/core';
import { MicroUploadModule } from './micro-upload.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MicroUploadModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.MICRO_UPLOAD_PORT || '3004', 10),
      },
    },
  );
  await app.listen();
}
bootstrap();
