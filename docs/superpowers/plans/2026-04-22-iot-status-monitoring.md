# 测点/设备/站点在线状态监控实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现基于 Redis 增量回写的三态模型（正常、部分异常、离线），以精确判定测点、设备和站点的在线状态。

**Architecture:** 
1. 数据库层面在设备和测点表增加 `expected_cycle` 字段，提供超时配置。
2. 数据接入微服务 (`micro-data-integration`) 在接收到数据时，向 Redis Hash 结构 `iot:point:active` 更新测点最后活跃时间戳。
3. 监控微服务 (`micro-monitor`) 通过 Cron 任务（每分钟）从数据库全量同步设备树配置，结合 Redis 中的活跃时间，推导并缓存三态在线状态树。当检测到状态发生变更时，调用基础微服务 (`micro-water-basic`) 批量执行状态更新。

**Tech Stack:** NestJS, TypeORM, Redis, @nestjs/schedule, TCP Microservices

---

### Task 1: 数据库实体变更与建表脚本更新

**Files:**
- Modify: `server/libs/common/src/entities/water-basic/water-device.entity.ts`
- Modify: `server/libs/common/src/entities/water-basic/water-point.entity.ts`
- Create: `server/db/1.3.2-add-expected-cycle-to-device-and-point.sql`

- [ ] **Step 1: 在 `water_device.entity.ts` 中添加 `expectedCycle` 字段**

```typescript
  @ApiProperty({ type: Number, description: '预期数据周期(分钟)', required: false })
  @Column({ type: 'int', name: 'expected_cycle', comment: '预期数据周期(分钟)', nullable: true })
  public expectedCycle: number;
```
*(将此段代码插入到 `WaterDeviceEntity` 的合适位置，例如 `installDate` 后)*

- [ ] **Step 2: 在 `water_point.entity.ts` 中添加 `expectedCycle` 字段**

```typescript
  @ApiProperty({ type: Number, description: '预期数据周期(分钟)', required: false })
  @Column({ type: 'int', name: 'expected_cycle', comment: '预期数据周期(分钟)', nullable: true })
  public expectedCycle: number;
```
*(将此段代码插入到 `WaterPointEntity` 的合适位置，例如 `dataType` 后)*

- [ ] **Step 3: 编写 SQL 更新脚本**

```sql
-- server/db/1.3.2-add-expected-cycle-to-device-and-point.sql

SET NAMES utf8mb4;

-- 尝试在 water_device 表增加 expected_cycle 字段
SET @dbname = DATABASE();
SET @tablename = 'water_device';
SET @columnname = 'expected_cycle';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT NULL COMMENT \'预期数据周期(分钟)\' AFTER `status`;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 尝试在 water_point 表增加 expected_cycle 字段
SET @tablename = 'water_point';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT NULL COMMENT \'预期数据周期(分钟)\' AFTER `status`;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

```

- [ ] **Step 4: Commit**

```bash
git add server/libs/common/src/entities/water-basic/water-device.entity.ts server/libs/common/src/entities/water-basic/water-point.entity.ts server/db/1.3.2-add-expected-cycle-to-device-and-point.sql
git commit -m "feat: [数据库] 设备与测点表新增 expected_cycle 预期周期字段"
```

---

### Task 2: `micro-data-integration` 接入数据时更新 Redis 活跃时间

**Files:**
- Modify: `server/apps/micro-data-integration/src/receiver/receiver.service.ts`

- [ ] **Step 1: 注入 RedisService 并更新接收逻辑**

在 `receiver.service.ts` 中引入 `RedisService` 并注入。

```typescript
import { RedisService } from '@app/shared/redis/redis.service';

// ... 在 ReceiverService 的 constructor 中添加
constructor(
  // ... 其他依赖
  private readonly redisService: RedisService,
) {}
```

- [ ] **Step 2: 在 `receiveData` 方法中增加更新 Redis 的逻辑**

在 `receiveData` 成功插入 TDengine 之后（`successCount++;` 下方），加入 Redis 记录活跃时间的代码：

```typescript
      try {
        await this.tdengineService.insertData(deviceCode, pointCode, val, ts);
        successCount++;
        
        // 记录最新活跃时间到 Redis (使用当前系统时间而不是数据的时间戳，因为数据可能由于延迟送达)
        // 键: iot:point:active, field: pointCode, value: 当前时间戳(ms)
        // 只更新实时模式的数据，如果是自动回填的历史数据则跳过
        if (!autoBackfill) {
           await this.redisService.getClient().hset('iot:point:active', pointCode, Date.now().toString());
        }
// ...
```

- [ ] **Step 3: 在 `generateMockData` 方法中增加更新 Redis 的逻辑**

在 `generateMockData` 的插入逻辑中，也更新 Redis：

```typescript
      try {
        await this.tdengineService.insertData(deviceCode, pointCode, val, ts);
        
        if (timeRange === 'realtime') {
           await this.redisService.getClient().hset('iot:point:active', pointCode, Date.now().toString());
        }
// ...
```

- [ ] **Step 4: Commit**

```bash
git add server/apps/micro-data-integration/src/receiver/receiver.service.ts
git commit -m "feat: [数据接入] 接收数据时向 Redis 写入测点最新活跃时间"
```

---

### Task 3: `micro-water-basic` 增加批量更新状态的 TCP 接口

**Files:**
- Modify: `server/apps/micro-water-basic/src/water-basic.controller.ts`
- Modify: `server/apps/micro-water-basic/src/water-basic.service.ts`

- [ ] **Step 1: 在 `water-basic.service.ts` 中添加批量更新方法**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WaterPointEntity, WaterDeviceEntity, WaterStationEntity } from '@app/common';

@Injectable()
export class WaterBasicService {
  private readonly logger = new Logger(WaterBasicService.name);

  constructor(
    @InjectRepository(WaterPointEntity) private readonly pointRep: Repository<WaterPointEntity>,
    @InjectRepository(WaterDeviceEntity) private readonly deviceRep: Repository<WaterDeviceEntity>,
    @InjectRepository(WaterStationEntity) private readonly stationRep: Repository<WaterStationEntity>,
  ) {}

  // ... 现有的 getHello() 方法

  async batchUpdateStatus(payload: { points: {code: string, status: string}[], devices: {code: string, status: string}[], stations: {code: string, status: string}[] }) {
    this.logger.log(`接收到状态批量更新指令: 测点${payload.points.length}个, 设备${payload.devices.length}个, 站点${payload.stations.length}个`);
    
    // 更新测点状态
    if (payload.points && payload.points.length > 0) {
      for (const p of payload.points) {
        await this.pointRep.update({ code: p.code }, { status: p.status });
      }
    }

    // 更新设备状态
    if (payload.devices && payload.devices.length > 0) {
      for (const d of payload.devices) {
        await this.deviceRep.update({ code: d.code }, { status: d.status });
      }
    }

    // 更新站点状态
    if (payload.stations && payload.stations.length > 0) {
      for (const s of payload.stations) {
        await this.stationRep.update({ code: s.code }, { status: s.status });
      }
    }

    return { success: true };
  }
}
```

- [ ] **Step 2: 在 `water-basic.controller.ts` 中暴露 TCP 路由**

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WaterBasicService } from './water-basic.service';

@Controller()
export class WaterBasicController {
  constructor(private readonly waterBasicService: WaterBasicService) {}

  // ... 现有的 HTTP 接口

  @MessagePattern('water.status.batchUpdate')
  async batchUpdateStatus(@Payload() payload: { points: {code: string, status: string}[], devices: {code: string, status: string}[], stations: {code: string, status: string}[] }) {
    return this.waterBasicService.batchUpdateStatus(payload);
  }
}
```

- [ ] **Step 3: 确保 `WaterBasicModule` 引入了需要的实体**

检查 `server/apps/micro-water-basic/src/water-basic.module.ts`，确保 imports 中包含 `TypeOrmModule.forFeature([WaterPointEntity, WaterDeviceEntity, WaterStationEntity])`。

- [ ] **Step 4: Commit**

```bash
git add server/apps/micro-water-basic/src/water-basic.service.ts server/apps/micro-water-basic/src/water-basic.controller.ts
git commit -m "feat: [水务基础] 提供基于 TCP 的资产状态批量更新接口"
```

---

### Task 4: `micro-monitor` 实现状态监控与增量推导引擎

**Files:**
- Create: `server/apps/micro-monitor/src/module/monitor/status-engine/status-engine.module.ts`
- Create: `server/apps/micro-monitor/src/module/monitor/status-engine/status-engine.service.ts`
- Modify: `server/apps/micro-monitor/src/module/monitor/monitor.module.ts`

- [ ] **Step 1: 创建 `status-engine.service.ts`**

这是一个核心的定时任务类，负责从 DB 加载结构，从 Redis 加载活跃时间，计算三态并增量更新。

```typescript
import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { WaterPointEntity, WaterDeviceEntity, WaterStationEntity } from '@app/common';
import { RedisService } from '@app/shared/redis/redis.service';

@Injectable()
export class StatusEngineService implements OnModuleInit {
  private readonly logger = new Logger(StatusEngineService.name);
  private readonly GLOBAL_DEFAULT_CYCLE = 15; // 默认超时时间 15 分钟

  // 内存缓存设备树结构
  private pointMap = new Map<string, any>();
  private deviceMap = new Map<string, any>();
  private stationMap = new Map<string, any>();

  constructor(
    @InjectRepository(WaterPointEntity) private readonly pointRep: Repository<WaterPointEntity>,
    @InjectRepository(WaterDeviceEntity) private readonly deviceRep: Repository<WaterDeviceEntity>,
    @InjectRepository(WaterStationEntity) private readonly stationRep: Repository<WaterStationEntity>,
    private readonly redisService: RedisService,
    @Inject('MICRO_WATER_BASIC') private readonly waterBasicClient: ClientProxy,
  ) {}

  async onModuleInit() {
    // 延迟加载，防止启动冲突
    setTimeout(() => {
      this.refreshAssetTree();
    }, 5000);
  }

  // 每小时全量刷新一次设备树结构
  @Cron(CronExpression.EVERY_HOUR)
  async refreshAssetTree() {
    try {
      // 查出所有未删除且启用(或曾停用但需监控)的资产，此处简化为全量
      const points = await this.pointRep.find({ where: { delFlag: '0' } });
      const devices = await this.deviceRep.find({ where: { delFlag: '0' } });
      const stations = await this.stationRep.find({ where: { delFlag: '0' } });

      this.pointMap.clear();
      this.deviceMap.clear();
      this.stationMap.clear();

      points.forEach(p => this.pointMap.set(p.code, p));
      devices.forEach(d => this.deviceMap.set(d.code, d));
      stations.forEach(s => this.stationMap.set(s.code, s));
      
      this.logger.log(`刷新设备树成功: 测点${points.length} 设备${devices.length} 站点${stations.length}`);
    } catch (e) {
      this.logger.error('刷新设备树失败', e.message);
    }
  }

  // 每分钟执行一次心跳状态检测
  @Cron(CronExpression.EVERY_MINUTE)
  async checkStatus() {
    if (this.pointMap.size === 0) return; // 还没加载完

    const now = Date.now();
    const redisClient = this.redisService.getClient();
    
    // 1. 获取所有测点最新活跃时间
    const activeTimes = await redisClient.hgetall('iot:point:active');
    
    // 获取上次的状态树用于比对增量
    const lastTreeStr = await redisClient.get('iot:status:tree');
    const lastTree = lastTreeStr ? JSON.parse(lastTreeStr) : {};
    const newTree: Record<string, string> = {};

    const changedPoints = [];
    const changedDevices = [];
    const changedStations = [];

    // 2. 计算测点状态
    const deviceChildrenStatus = new Map<string, string[]>(); // key: deviceCode, value: array of statuses ('0'|'2')

    for (const [pCode, point] of this.pointMap.entries()) {
      // 获取周期：测点独立周期 > 设备继承周期 > 全局默认
      let cycle = point.expectedCycle;
      if (!cycle) {
        const device = this.deviceMap.get(point.deviceCode);
        cycle = device?.expectedCycle || this.GLOBAL_DEFAULT_CYCLE;
      }

      const lastActive = activeTimes[pCode] ? parseInt(activeTimes[pCode], 10) : 0;
      const isTimeout = (now - lastActive) > cycle * 60 * 1000;
      
      const status = isTimeout ? '2' : '0'; // 0: 在线, 2: 离线
      newTree[`p_${pCode}`] = status;

      // 增量判定
      if (lastTree[`p_${pCode}`] !== status && point.status !== status) {
        changedPoints.push({ code: pCode, status });
      }

      // 归集到所属设备
      if (point.deviceCode) {
        if (!deviceChildrenStatus.has(point.deviceCode)) {
          deviceChildrenStatus.set(point.deviceCode, []);
        }
        deviceChildrenStatus.get(point.deviceCode).push(status);
      }
    }

    // 3. 计算设备状态
    const stationChildrenStatus = new Map<string, string[]>();

    for (const [dCode, device] of this.deviceMap.entries()) {
      const pStatuses = deviceChildrenStatus.get(dCode) || ['2']; // 没测点的默认离线
      
      let status = '0';
      const hasOnline = pStatuses.includes('0');
      const hasOffline = pStatuses.includes('2');

      if (hasOnline && !hasOffline) status = '0'; // 全在线
      else if (!hasOnline && hasOffline) status = '2'; // 全离线
      else status = '1'; // 部分在线/异常

      newTree[`d_${dCode}`] = status;

      if (lastTree[`d_${dCode}`] !== status && device.status !== status) {
        changedDevices.push({ code: dCode, status });
      }

      // 归集到所属站点
      if (device.stationCode) {
        if (!stationChildrenStatus.has(device.stationCode)) {
          stationChildrenStatus.set(device.stationCode, []);
        }
        stationChildrenStatus.get(device.stationCode).push(status);
      }
    }

    // 4. 计算站点状态
    for (const [sCode, station] of this.stationMap.entries()) {
      const dStatuses = stationChildrenStatus.get(sCode) || ['2'];

      let status = '0';
      const hasOffline = dStatuses.includes('2') || dStatuses.includes('1');
      const hasOnline = dStatuses.includes('0') || dStatuses.includes('1');

      if (hasOnline && !hasOffline) status = '0'; // 全在线
      else if (!hasOnline && hasOffline) status = '2'; // 全离线
      else status = '1'; // 部分在线/异常

      newTree[`s_${sCode}`] = status;

      if (lastTree[`s_${sCode}`] !== status && station.status !== status) {
        changedStations.push({ code: sCode, status });
      }
    }

    // 5. 保存最新状态树到 Redis
    await redisClient.set('iot:status:tree', JSON.stringify(newTree));

    // 6. 如果有变更，发起增量更新请求
    const totalChanges = changedPoints.length + changedDevices.length + changedStations.length;
    if (totalChanges > 0) {
      this.logger.log(`检测到状态变更，触发回写: 测点${changedPoints.length} 设备${changedDevices.length} 站点${changedStations.length}`);
      try {
        this.waterBasicClient.emit('water.status.batchUpdate', {
          points: changedPoints,
          devices: changedDevices,
          stations: changedStations
        });
      } catch (e) {
        this.logger.error('回写状态通知失败', e);
      }
    }
  }
}
```

- [ ] **Step 2: 创建 `status-engine.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WaterPointEntity, WaterDeviceEntity, WaterStationEntity } from '@app/common';
import { StatusEngineService } from './status-engine.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([WaterPointEntity, WaterDeviceEntity, WaterStationEntity]),
    ClientsModule.register([
      {
        name: 'MICRO_WATER_BASIC',
        transport: Transport.TCP,
        options: { host: process.env.MICRO_WATER_BASIC_HOST || '127.0.0.1', port: 3006 },
      },
    ]),
  ],
  providers: [StatusEngineService],
})
export class StatusEngineModule {}
```

- [ ] **Step 3: 将新模块引入 `micro-monitor/src/micro-monitor.module.ts`**

修改 `server/apps/micro-monitor/src/micro-monitor.module.ts`，导入 `StatusEngineModule`。

```typescript
// ... 其他 import
import { StatusEngineModule } from './module/monitor/status-engine/status-engine.module';

@Module({
  imports: [
    // ... 现有的 imports
    StatusEngineModule
  ],
  // ...
})
export class MicroMonitorModule {}
```

- [ ] **Step 4: 修复 `micro-water-basic` TCP 配置**

检查 `server/apps/micro-water-basic/src/main.ts`，确保 TCP 微服务已启用并绑定 `3006` 端口（如果它还没启用 `connectMicroservice` 的话，需要添加。根据之前的服务约定，它可能使用了 5006，这里需要确保端口匹配。假设我们统一使用 3006 作为 TCP 通信口或者增加 `app.connectMicroservice` 代码）。

*注：若 `micro-water-basic/main.ts` 没有 TCP 监听，请补充如下代码：*
```typescript
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 3006 }, // 或者按您的约定端口，建议在 config 中统一
  });
  await app.startAllMicroservices();
```

- [ ] **Step 5: Commit**

```bash
git add server/apps/micro-monitor/src/module/monitor/status-engine server/apps/micro-monitor/src/micro-monitor.module.ts server/apps/micro-water-basic/src/main.ts
git commit -m "feat: [监控] 增加定时计算与推导设备在线三态的增量回写引擎"
```
