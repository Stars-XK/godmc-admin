import { NestFactory } from '@nestjs/core';
import { MicroDataIntegrationModule } from './micro-data-integration.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionsFilter } from '@app/common/filters/http-exceptions-filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(MicroDataIntegrationModule, { cors: true });
  
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  
  const config = app.get(ConfigService);
  const prefix = config.get<string>('app.prefix') || '';
  app.setGlobalPrefix(prefix);
  
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionsFilter());

  const swaggerOptions = new DocumentBuilder()
    .setTitle('Data Integration Service')
    .setDescription('数据接入微服务 API 文档')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
        description: '请在请求头中携带 JWT 令牌，格式：Bearer <token>',
      },
      'Authorization',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup(`${prefix}/data-integration/swagger-ui`, app, document);

  await app.listen(3007);
  console.log(`Micro-Data-Integration is running on http://localhost:3007${prefix}/`);
}
bootstrap();