import { NestFactory } from '@nestjs/core';
import { MicroAlarmModule } from './micro-alarm.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(MicroAlarmModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('报警中心接口文档')
    .setDescription('提供报警规则配置、报警历史查询、报警引擎等功能')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const port = process.env.SERVICE_PORT || 3008;
  await app.listen(port);
  console.log(`Micro-alarm is running on port ${port}`);
}
bootstrap();
