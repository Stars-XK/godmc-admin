import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
class TestModule {}

async function bootstrap() {
  const app = await NestFactory.create(TestModule);
  const configService = app.get(ConfigService);
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 3001,
    },
  });

  await app.startAllMicroservices();
  await app.init();
  console.log('Microservice started');
  process.exit(0);
}
bootstrap();
