# Pure Routing Gateway Refactoring Plan (Water Basic Module)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the `api-gateway` into a pure routing gateway by moving HTTP controllers and DTOs to `micro-water-basic`, and using `http-proxy-middleware` for request forwarding.

**Architecture:** 
1. Convert `micro-water-basic` from a pure TCP microservice to a hybrid (or pure HTTP) application that exposes REST APIs with Swagger and Guards.
2. Transfer the HTTP Controller (`zone.controller.ts`) and specific Service logic (import/export) from `api-gateway` to `micro-water-basic`.
3. Install and configure `http-proxy-middleware` in `api-gateway` to dynamically proxy `/water-basic` requests to `127.0.0.1:3006`.

**Tech Stack:** NestJS, express, http-proxy-middleware, exceljs.

---

### Task 1: Refactor `micro-water-basic` to an HTTP Application

**Files:**
- Modify: `server/apps/micro-water-basic/src/main.ts`

- [ ] **Step 1: Convert `main.ts` to NestExpressApplication**
Update the bootstrap function to create an HTTP application, setup global prefix, validation pipes, exceptions filter, guards, and Swagger, similar to the gateway but without the proxy.

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroWaterBasicModule } from './micro-water-basic.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionsFilter } from '@app/common/filters/http-exceptions-filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(MicroWaterBasicModule, { cors: true });
  const config = app.get(ConfigService);
  
  app.setGlobalPrefix('water-basic');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionsFilter());

  const swaggerOptions = new DocumentBuilder()
    .setTitle('Water Basic Service')
    .setDescription('水务基础模块 API 文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('water-basic/swagger-ui', app, document);

  await app.listen(3006);
  console.log(`Micro-Water-Basic is running on http://localhost:3006`);
}
bootstrap();
```

- [ ] **Step 2: Commit**
```bash
git commit -am "refactor: [架构] 转换 micro-water-basic 为独立 HTTP 应用"
```

### Task 2: Migrate Controllers and Services to Microservice

**Files:**
- Modify: `server/apps/micro-water-basic/src/module/zone/zone.controller.ts`
- Modify: `server/apps/micro-water-basic/src/module/zone/zone.service.ts`

- [ ] **Step 1: Overwrite `zone.controller.ts` with HTTP Controller**
Replace the TCP MessagePattern controller in `micro-water-basic` with the REST Controller from the gateway.
```typescript
import { Controller, Get, Post, Body, Put, Param, Delete, Query, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZoneService } from './zone.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { User } from '@app/common/decorators/user.decorator';

@ApiTags('水务基础-分区管理')
@ApiBearerAuth()
@Controller('zone')
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  @ApiOperation({ summary: '新增分区' })
  @RequirePermission('water-basic:zone:add')
  @Post()
  create(@Body() createDto: any, @User() user: any) {
    return this.zoneService.create(createDto, user);
  }

  @ApiOperation({ summary: '查询分区树' })
  @RequirePermission('water-basic:zone:query')
  @Get('tree')
  findTree(@Query() query: any, @User() user: any) {
    return this.zoneService.findTree(query, user);
  }

  @ApiOperation({ summary: '查询分区详情' })
  @RequirePermission('water-basic:zone:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zoneService.findOne(+id);
  }

  @ApiOperation({ summary: '修改分区' })
  @RequirePermission('water-basic:zone:edit')
  @Put()
  update(@Body() updateDto: any, @User() user: any) {
    return this.zoneService.update(updateDto, user);
  }

  @ApiOperation({ summary: '删除分区' })
  @RequirePermission('water-basic:zone:remove')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.zoneService.remove(+id);
  }

  @ApiOperation({ summary: '导出分区数据' })
  @RequirePermission('water-basic:zone:export')
  @Post('export')
  export(@Res() res: Response, @Body() query: any, @User() user: any) {
    return this.zoneService.export(res, query, user);
  }

  @ApiOperation({ summary: '下载导入模板' })
  @Get('importTemplate')
  importTemplate(@Res() res: Response) {
    return this.zoneService.importTemplate(res);
  }

  @ApiOperation({ summary: '导入分区数据' })
  @RequirePermission('water-basic:zone:import')
  @Post('importData')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        parentId: { type: 'integer' }
      },
    },
  })
  importData(@UploadedFile() file: Express.Multer.File, @Body('parentId') parentId: string, @User() user: any) {
    return this.zoneService.importData(file, parentId ? parseInt(parentId, 10) : 0, user);
  }
}
```

- [ ] **Step 2: Add Export and Import logic to Service**
In `micro-water-basic/src/module/zone/zone.service.ts`, import `Response`, `ExportTable`, and `exceljs`, then implement `export`, `importTemplate`, and update `importData` to accept `Express.Multer.File`. 
(Use the logic that currently exists in `api-gateway`'s `zone.service.ts`).

- [ ] **Step 3: Commit**
```bash
git commit -am "refactor: [架构] 迁移 HTTP 控制器与 Excel 逻辑至微服务"
```

### Task 3: Clean up API Gateway & Add Proxy

**Files:**
- Modify: `server/package.json`
- Modify: `server/apps/api-gateway/src/main.ts`
- Delete: `server/apps/api-gateway/src/module/water-basic`
- Modify: `server/apps/api-gateway/src/app.module.ts`
- Modify: `server/apps/api-gateway/src/microservices.module.ts`

- [ ] **Step 1: Install Proxy Middleware**
Run: `npm install http-proxy-middleware -w server`

- [ ] **Step 2: Remove old module from Gateway**
Run: `rm -rf server/apps/api-gateway/src/module/water-basic`
Remove `WaterBasicModule` imports and references from `server/apps/api-gateway/src/app.module.ts`.
Remove `MICRO_WATER_BASIC` from `server/apps/api-gateway/src/microservices.module.ts`.

- [ ] **Step 3: Configure Proxy in Gateway**
In `server/apps/api-gateway/src/main.ts`, import `createProxyMiddleware` and use it.
```typescript
import { createProxyMiddleware } from 'http-proxy-middleware';

// After app.use(requestIpMw(...))
app.use(
  `${prefix}/water-basic`,
  createProxyMiddleware({
    target: 'http://127.0.0.1:3006',
    changeOrigin: true,
    pathRewrite: {
      [`^${prefix}/water-basic`]: '/water-basic',
    },
  }),
);
```

- [ ] **Step 4: Provide Auth Guards to Microservice**
Ensure `JwtAuthGuard`, `RolesGuard`, and `PermissionGuard` are provided in `MicroWaterBasicModule` (or globally) just like in `api-gateway/src/app.module.ts`, so the standalone app still verifies tokens.

- [ ] **Step 5: Commit**
```bash
git add server/apps/api-gateway/ server/package.json server/apps/micro-water-basic/
git commit -m "refactor: [架构] 网关引入代理中间件并移除冗余代码"
```
