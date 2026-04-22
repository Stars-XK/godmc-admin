import { NestFactory } from '@nestjs/core';
import { MicroWaterBasicModule } from './micro-water-basic.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionsFilter } from '@app/common/filters/http-exceptions-filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(MicroWaterBasicModule, { cors: true });
  
  // 设置请求体大小限制，解决 PayloadTooLargeError (支持大文件解析后的大批量 JSON 导入)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  
  const config = app.get(ConfigService);
  
  // 设置全局前缀，对应于网关转发过来的路径
  const prefix = config.get<string>('app.prefix') || '';
  app.setGlobalPrefix(prefix);
  
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionsFilter());

  const swaggerOptions = new DocumentBuilder()
    .setTitle('Water Basic Service')
    .setDescription('水务基础模块 API 文档')
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
  SwaggerModule.setup(`${prefix}/water-basic/swagger-ui`, app, document);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 5006 },
  });

  await app.startAllMicroservices();
  await app.listen(3006);
  console.log(`micro-water-basic HTTP is running on http://localhost:3006${prefix}/`);
  console.log(`micro-water-basic TCP is running on port 5006`);
}
bootstrap();
