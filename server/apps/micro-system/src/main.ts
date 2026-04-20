import { NestFactory } from '@nestjs/core';
import { MicroSystemModule } from './micro-system.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionsFilter } from '@app/common/filters/http-exceptions-filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(MicroSystemModule, { cors: true });
  const config = app.get(ConfigService);
  
  const prefix = config.get<string>('app.prefix') || '';
  app.setGlobalPrefix(prefix);
  
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionsFilter());

  const swaggerOptions = new DocumentBuilder()
    .setTitle('System Service')
    .setDescription('System Service API 文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup(`${prefix}/system/swagger-ui`, app, document);

  // 保持原有 TCP 微服务通信（端口改为 5002），直到阶段三、四完成后再移除
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 5002 },
  });

  await app.startAllMicroservices();
  await app.listen(3002);
  console.log(`micro-system HTTP is running on http://localhost:3002${prefix}/`);
  console.log(`micro-system TCP is running on port 5002`);
}
bootstrap();
