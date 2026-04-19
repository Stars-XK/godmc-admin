import { NestFactory } from '@nestjs/core';
import { MicroToolsModule } from './micro-tools.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MicroToolsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.MICRO_TOOLS_PORT || '3005', 10),
      },
    },
  );
  await app.listen();
}
bootstrap();
