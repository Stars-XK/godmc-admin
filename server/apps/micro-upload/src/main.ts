import { NestFactory } from '@nestjs/core';
import { MicroUploadModule } from './micro-upload.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionsFilter } from '@app/common/filters/http-exceptions-filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(MicroUploadModule, { cors: true });
  const config = app.get(ConfigService);
  
  const prefix = config.get<string>('app.prefix') || '';
  app.setGlobalPrefix(prefix);
  
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionsFilter());

  const swaggerOptions = new DocumentBuilder()
    .setTitle('Upload Service')
    .setDescription('Upload Service API 文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup(`${prefix}/upload/swagger-ui`, app, document);

  // 保持原有 TCP 微服务通信（端口改为 5004），直到阶段三、四完成后再移除
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 5004 },
  });

  await app.startAllMicroservices();
  await app.listen(3004);
  console.log(`micro-upload HTTP is running on http://localhost:3004${prefix}/`);
  console.log(`micro-upload TCP is running on port 5004`);
}
bootstrap();
