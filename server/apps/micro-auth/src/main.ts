import { NestFactory } from '@nestjs/core';
import { MicroAuthModule } from './micro-auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionsFilter } from '@app/common/filters/http-exceptions-filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(MicroAuthModule, { cors: true });
  const config = app.get(ConfigService);
  
  const prefix = config.get<string>('app.prefix') || '/api';
  app.setGlobalPrefix(prefix);
  
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionsFilter());

  const swaggerOptions = new DocumentBuilder()
    .setTitle('Auth Service')
    .setDescription('Auth Service API 文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup(`${prefix}/auth/swagger-ui`, app, document);

  // 保持原有 TCP 微服务通信（端口改为 5001），直到阶段三、四完成后再移除
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 5001 },
  });

  await app.startAllMicroservices();
  await app.listen(3001);
  console.log(`micro-auth HTTP is running on http://localhost:3001${prefix}/`);
  console.log(`micro-auth TCP is running on port 5001`);
}
bootstrap();
