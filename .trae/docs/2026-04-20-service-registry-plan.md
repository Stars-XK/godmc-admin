# Service Registry and Monitoring Implementation Plan (Phase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Redis-based service registry where all microservices send heartbeats, and provide an API and frontend page in `monitor` to display their online status.

**Architecture:** 
1. Create a `RegistryModule` in `@app/common` that uses `@nestjs/schedule` to run a cron job every 10 seconds.
2. The cron job writes `SET microservice:<name>:<host>:<port> {...info} EX 15` to Redis.
3. Import `RegistryModule` into all existing microservices and the gateway.
4. Add a `registry` controller in the gateway/monitor module to read `KEYS microservice:*` from Redis and return the list.
5. Add a frontend page in `admin/src/views/monitor/registry` to display the online services.

**Tech Stack:** NestJS, Redis (ioredis), Vue 3, Element Plus.

---

### Task 1: Create Shared Registry Module

**Files:**
- Create: `server/libs/common/src/registry/registry.module.ts`
- Create: `server/libs/common/src/registry/registry.service.ts`
- Modify: `server/libs/common/src/index.ts`

- [ ] **Step 1: Write `registry.service.ts`**
Create the service that connects to Redis and sends heartbeats.
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@app/shared';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as os from 'os';

@Injectable()
export class RegistryService implements OnModuleInit, OnModuleDestroy {
  private serviceName: string;
  private servicePort: number;
  private serviceHost: string;
  private redisKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    // 优先从环境变量获取，如果没有则尝试从配置获取
    this.serviceName = process.env.SERVICE_NAME || this.configService.get<string>('app.name') || 'unknown-service';
    this.servicePort = parseInt(process.env.SERVICE_PORT || this.configService.get<string>('app.port') || '0', 10);
    this.serviceHost = this.getIpAddress();
    this.redisKey = `microservice:${this.serviceName}:${this.serviceHost}:${this.servicePort}`;
    
    // 启动时立即发送一次心跳
    this.sendHeartbeat();
  }

  onModuleDestroy() {
    // 服务关闭时主动删除注册信息
    if (this.redisKey) {
      this.redisService.getRedis().del(this.redisKey).catch(console.error);
    }
  }

  @Cron('*/10 * * * * *')
  async sendHeartbeat() {
    if (!this.servicePort) return; // 未配置端口的服务不注册（如工具类）
    
    const payload = {
      name: this.serviceName,
      host: this.serviceHost,
      port: this.servicePort,
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
      memoryUsage: process.memoryUsage().heapUsed,
    };

    try {
      // 写入 Redis 并设置 15 秒过期时间
      await this.redisService.getRedis().set(this.redisKey, JSON.stringify(payload), 'EX', 15);
    } catch (error) {
      console.error(`[RegistryService] Failed to send heartbeat for ${this.serviceName}`, error);
    }
  }

  private getIpAddress(): string {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          return alias.address;
        }
      }
    }
    return '127.0.0.1';
  }
}
```

- [ ] **Step 2: Write `registry.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RegistryService } from './registry.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [RegistryService],
  exports: [RegistryService],
})
export class RegistryModule {}
```

- [ ] **Step 3: Export from `index.ts`**
Append to `server/libs/common/src/index.ts`:
```typescript
export * from './registry/registry.module';
export * from './registry/registry.service';
```

- [ ] **Step 4: Commit**
```bash
git add server/libs/common/src/registry/ server/libs/common/src/index.ts
git commit -m "feat: [新增] 共享微服务 Redis 注册与心跳模块"
```

### Task 2: Inject RegistryModule into All Apps

**Files:**
- Modify: `server/apps/api-gateway/src/app.module.ts`
- Modify: `server/apps/micro-auth/src/micro-auth.module.ts`
- Modify: `server/apps/micro-system/src/micro-system.module.ts`
- Modify: `server/apps/micro-monitor/src/micro-monitor.module.ts`
- Modify: `server/apps/micro-upload/src/micro-upload.module.ts`
- Modify: `server/apps/micro-tools/src/micro-tools.module.ts`
- Modify: `server/apps/micro-water-basic/src/micro-water-basic.module.ts`

- [ ] **Step 1: Add `RegistryModule` to imports**
For each of the files above, import `RegistryModule` from `@app/common` and add it to the `imports` array.

- [ ] **Step 2: Define Service Names in Environment**
In `server/package.json`, modify the `start:all` script to inject `SERVICE_NAME` and `SERVICE_PORT` into `cross-env`.
```json
"start:all": "concurrently -c \"cyan,yellow,green,magenta,blue,red,white\" -n \"gateway,auth,system,monitor,upload,tools,water\" \"cross-env NODE_ENV=development SERVICE_NAME=api-gateway SERVICE_PORT=8080 nest start api-gateway --watch\" \"cross-env NODE_ENV=development SERVICE_NAME=micro-auth SERVICE_PORT=3001 nest start micro-auth --watch\" \"cross-env NODE_ENV=development SERVICE_NAME=micro-system SERVICE_PORT=3002 nest start micro-system --watch\" \"cross-env NODE_ENV=development SERVICE_NAME=micro-monitor SERVICE_PORT=3003 nest start micro-monitor --watch\" \"cross-env NODE_ENV=development SERVICE_NAME=micro-upload SERVICE_PORT=3004 nest start micro-upload --watch\" \"cross-env NODE_ENV=development SERVICE_NAME=micro-tools SERVICE_PORT=3005 nest start micro-tools --watch\" \"cross-env NODE_ENV=development SERVICE_NAME=micro-water-basic SERVICE_PORT=3006 nest start micro-water-basic --watch\"",
```

- [ ] **Step 3: Commit**
```bash
git commit -am "feat: [集成] 所有微服务接入 Redis 心跳注册"
```

### Task 3: Backend API for Querying Registered Services

**Files:**
- Create: `server/apps/api-gateway/src/module/monitor/registry/registry.controller.ts`
- Create: `server/apps/api-gateway/src/module/monitor/registry/registry.module.ts`
- Modify: `server/apps/api-gateway/src/module/monitor/monitor.module.ts`
- Modify: `server/db/1.2.1-registry-menu.sql`

- [ ] **Step 1: Create Controller**
```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RedisService } from '@app/shared';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { ResultData } from '@app/common/utils/result';

@ApiTags('监控-服务注册中心')
@ApiBearerAuth()
@Controller('monitor/registry')
export class RegistryController {
  constructor(private readonly redisService: RedisService) {}

  @ApiOperation({ summary: '获取在线微服务列表' })
  @RequirePermission('monitor:registry:list')
  @Get('list')
  async getOnlineServices() {
    const redis = this.redisService.getRedis();
    const keys = await redis.keys('microservice:*');
    const services = [];
    
    if (keys && keys.length > 0) {
      const values = await redis.mget(...keys);
      for (let i = 0; i < values.length; i++) {
        if (values[i]) {
          try {
            services.push(JSON.parse(values[i]));
          } catch (e) {}
        }
      }
    }
    return ResultData.ok(services);
  }
}
```

- [ ] **Step 2: Create Module & Register**
Create `registry.module.ts` with the controller, then import `RegistryModule` into `monitor.module.ts`.

- [ ] **Step 3: Database Menu Script**
Create `server/db/1.2.1-registry-menu.sql`:
```sql
-- 插入服务注册中心菜单
SET @monitor_id = (SELECT menu_id FROM `sys_menu` WHERE `menu_name` = '系统监控' AND `parent_id` = 0 LIMIT 1);

INSERT INTO `sys_menu` (`menu_name`, `parent_id`, `order_num`, `path`, `component`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `remark`)
SELECT '服务状态', @monitor_id, 10, 'registry', 'monitor/registry/index', 1, 0, 'C', '0', '0', 'monitor:registry:list', 'server', 'admin', sysdate(), '微服务注册中心状态'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu` WHERE `menu_name` = '服务状态' AND `parent_id` = @monitor_id);
```

- [ ] **Step 4: Commit**
```bash
git add server/apps/api-gateway/src/module/monitor/registry/ server/db/
git commit -am "feat: [后端] 新增微服务在线状态查询 API"
```

### Task 4: Frontend Registry UI

**Files:**
- Create: `admin/src/api/monitor/registry.js`
- Create: `admin/src/views/monitor/registry/index.vue`

- [ ] **Step 1: Write API file**
```javascript
import request from '@/utils/request'

export function listOnlineServices() {
  return request({
    url: '/monitor/registry/list',
    method: 'get'
  })
}
```

- [ ] **Step 2: Write Vue Component**
```vue
<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>在线微服务列表 (基于 Redis 心跳检测)</span>
          <el-button type="primary" icon="Refresh" @click="getList" size="small" style="float: right">刷新</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="serviceList" style="width: 100%">
        <el-table-column prop="name" label="微服务名称" width="200" align="center" />
        <el-table-column prop="host" label="主机 IP" width="180" align="center" />
        <el-table-column prop="port" label="端口" width="120" align="center" />
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="scope">
            <el-tag type="success" v-if="scope.row.status === 'online'">在线</el-tag>
            <el-tag type="danger" v-else>离线</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内存占用 (MB)" align="center">
          <template #default="scope">
            {{ (scope.row.memoryUsage / 1024 / 1024).toFixed(2) }} MB
          </template>
        </el-table-column>
        <el-table-column prop="lastHeartbeat" label="最后心跳时间" align="center">
          <template #default="scope">
            {{ parseTime(scope.row.lastHeartbeat) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup name="Registry">
import { ref, onMounted, onUnmounted } from 'vue';
import { listOnlineServices } from '@/api/monitor/registry';

const loading = ref(true);
const serviceList = ref([]);
let timer = null;

function getList() {
  loading.value = true;
  listOnlineServices().then(response => {
    // 按照微服务名称排序
    serviceList.value = response.data.sort((a, b) => a.name.localeCompare(b.name));
    loading.value = false;
  });
}

onMounted(() => {
  getList();
  // 每 10 秒自动刷新一次列表
  timer = setInterval(() => {
    listOnlineServices().then(response => {
      serviceList.value = response.data.sort((a, b) => a.name.localeCompare(b.name));
    });
  }, 10000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
```

- [ ] **Step 3: Commit**
```bash
git add admin/src/api/monitor/ admin/src/views/monitor/registry/
git commit -m "feat: [前端] 新增微服务状态监控页面"
```
