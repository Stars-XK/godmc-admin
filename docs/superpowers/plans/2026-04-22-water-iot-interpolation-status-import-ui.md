# Water IoT Interpolation / Status / Import / UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 TDengine 的 `meters_5m/1h/1d` 聚合表具备可用于二次计算的插值数据（落库），并修复/增强状态更新、导入模板字典映射与站点树右侧展示体验。

**Architecture:** 原始数据只写入 `meters`；聚合表由数据库侧 SQL（`INTERVAL + FILL`）生成并落库，服务端只负责触发与编排（dirty 范围、增量补算、自愈重放）。前端只做展示与交互优化。

**Tech Stack:** NestJS + TypeORM + Redis + TDengine REST SQL + Vue3 + Element Plus + ECharts.

---

## Files Overview

**Backend (server)**
- Modify: `server/apps/micro-data-integration/src/receiver/receiver.service.ts`
- Modify: `server/apps/micro-data-integration/src/micro-data-integration.module.ts`
- Create: `server/apps/micro-data-integration/src/tdengine/tdengine-agg.service.ts`
- Create: `server/apps/micro-data-integration/src/tdengine/tdengine-agg.module.ts`
- Create: `server/apps/micro-data-integration/src/tdengine/tdengine-agg.scheduler.ts`
- Modify: `server/apps/micro-data-integration/src/tdengine/tdengine.service.ts`
- Modify: `server/apps/micro-monitor/src/module/monitor/status-engine/status-engine.service.ts`
- Modify: `server/apps/micro-water-basic/src/micro-water-basic.service.ts`
- Modify: `server/apps/micro-water-basic/src/module/equipment/{station,device,point}.service.ts`

**Frontend (admin)**
- Modify: `admin/src/views/water-basic/station-device-point/components/OverviewTab.vue`

**Docs**
- Already added: `docs/superpowers/specs/2026-04-22-water-iot-interpolation-status-import-ui-design.md`

---

### Task 1: 增量插值落库（meters_5m/1h/1d）

**Files:**
- Modify: `server/apps/micro-data-integration/src/micro-data-integration.module.ts`
- Modify: `server/apps/micro-data-integration/src/receiver/receiver.service.ts`
- Create: `server/apps/micro-data-integration/src/tdengine/tdengine-agg.service.ts`
- Create: `server/apps/micro-data-integration/src/tdengine/tdengine-agg.module.ts`
- Create: `server/apps/micro-data-integration/src/tdengine/tdengine-agg.scheduler.ts`
- Modify: `server/apps/micro-data-integration/src/tdengine/tdengine.service.ts`

- [ ] **Step 1: 为 micro-data-integration 增加 WaterPointEntity Repository**

修改 `MicroDataIntegrationModule` 的 TypeORM entities & forFeature，让 `TdengineAggService` 能读到测点元数据（type/dataType）。

```ts
// server/apps/micro-data-integration/src/micro-data-integration.module.ts
import { WaterPointEntity } from '@app/common';

// ...
entities: [
  `${__dirname}/**/*.entity{.ts,.js}`,
  DataIntegrationSourceEntity,
  DataIntegrationTaskEntity,
  DataIntegrationMappingEntity,
  WaterPointEntity,
],

TypeOrmModule.forFeature([
  DataIntegrationSourceEntity,
  DataIntegrationTaskEntity,
  DataIntegrationMappingEntity,
  WaterPointEntity,
]),
```

- [ ] **Step 2: 写入成功后标记 dirty 范围**

在 `ReceiverService.receiveData()` 的成功写入后添加：

```ts
// server/apps/micro-data-integration/src/receiver/receiver.service.ts
await this.redisService.getClient().sadd('iot:agg:dirty:set', `${deviceCode}|${pointCode}`);
await this.redisService.getClient().hset(`iot:agg:dirty:range:${deviceCode}|${pointCode}`, {
  minTs: ts.getTime().toString(),
  maxTs: ts.getTime().toString(),
});
```

并在同一 key 上做 min/max 合并（HGET/HSET）。

- [ ] **Step 3: 新增 TDengineAggService（生成 SQL、判定瞬时/累计、边界不外推）**

创建 `TdengineAggService`，提供：
- `normalizePointKind(point: WaterPointEntity): 'instant'|'cumulative'`（累计：`point.type === 'FLOW_TOTAL'` 或 `point.type.endsWith('_TOTAL')`）
- `getFirstLastTs(deviceCode, pointCode, start, end)`：SQL 查询 `FIRST/LAST`（只读）
- `rebuildAggTables(deviceCode, pointCode, start, end)`：对 5m/1h/1d 执行 delete+insert，瞬时用 `AVG + FILL(LINEAR)`，累计用 `LAST + FILL(PREV)`（累计桶 spread 固定 0）

```ts
// server/apps/micro-data-integration/src/tdengine/tdengine-agg.service.ts
export type AggInterval = '5m' | '1h' | '1d';
```

- [ ] **Step 4: 新增定时器 TdengineAggScheduler（分钟级处理 dirty 集合）**

每分钟：
- 扫 `iot:agg:dirty:set`（限制每轮 N 个）
- 读取并合并 range（minTs/maxTs）
- 调 `TdengineAggService.rebuildAggTables(...)`
- 成功后从 dirty set 移除；失败则保留以便下轮重试

- [ ] **Step 5: 验证**

Run:
```bash
cd /workspace/server && npm run build micro-data-integration
```
Expected: `compiled successfully`

- [ ] **Step 6: Commit**

```bash
git add server/apps/micro-data-integration/src/micro-data-integration.module.ts \
  server/apps/micro-data-integration/src/receiver/receiver.service.ts \
  server/apps/micro-data-integration/src/tdengine/tdengine-agg.service.ts \
  server/apps/micro-data-integration/src/tdengine/tdengine-agg.module.ts \
  server/apps/micro-data-integration/src/tdengine/tdengine-agg.scheduler.ts
git commit -m "feat: tdengine agg interpolation persisted to meters_5m/1h/1d"
```

---

### Task 2: TDengine 不可用时的“重放补算”自愈（保证原始不丢 + 聚合最终一致）

**Files:**
- Modify: `server/apps/micro-data-integration/src/receiver/receiver.service.ts`
- Create: `server/apps/micro-data-integration/src/tdengine/tdengine-retry.scheduler.ts`

- [ ] **Step 1: 插入失败时落入 Redis 重试队列**

在 catch 块里 push：

```ts
await this.redisService.getClient().lpush('iot:td:retry:list', JSON.stringify({
  deviceCode,
  pointCode,
  val,
  ts: ts.toISOString(),
}));
```

- [ ] **Step 2: 新增重试调度器**

每 10 秒 pop 一批（比如 200）重试写入；写入成功再标 dirty 与 active。

- [ ] **Step 3: 验证**

Run:
```bash
cd /workspace/server && npm run build micro-data-integration
```

- [ ] **Step 4: Commit**

```bash
git add server/apps/micro-data-integration/src/receiver/receiver.service.ts \
  server/apps/micro-data-integration/src/tdengine/tdengine-retry.scheduler.ts
git commit -m "feat: add tdengine retry queue and replay scheduler"
```

---

### Task 3: 状态更新分钟级链路可观测与稳定

**Files:**
- Modify: `server/apps/micro-monitor/src/module/monitor/status-engine/status-engine.service.ts`
- Modify: `server/apps/micro-water-basic/src/micro-water-basic.service.ts`

- [ ] **Step 1: micro-monitor 输出每轮统计日志**

在 `checkStatus()` 末尾打印：
- activeTimes keys 数
- changedPoints/devices/stations 数
- emit payload 数与 try/catch 错误

- [ ] **Step 2: micro-water-basic batchUpdate 输出耗时与成功数**

在 `batchUpdateStatus` 包裹计时，统计 update 成功/失败计数。

- [ ] **Step 3: 验证**

Run:
```bash
cd /workspace/server && npm run build micro-monitor && npm run build micro-water-basic
```

- [ ] **Step 4: Commit**

```bash
git add server/apps/micro-monitor/src/module/monitor/status-engine/status-engine.service.ts \
  server/apps/micro-water-basic/src/micro-water-basic.service.ts
git commit -m "chore: add observability logs for status pipeline"
```

---

### Task 4: 导入模板与字典映射统一（站点/设备/测点）

**Files:**
- Modify: `server/apps/micro-water-basic/src/module/equipment/point.service.ts`
- Modify: `server/apps/micro-water-basic/src/module/equipment/device.service.ts`
- Modify: `server/apps/micro-water-basic/src/module/equipment/station.service.ts`
- Modify: `server/libs/common/src/entities/water-basic/water-point.entity.ts`（默认值/注释）

- [ ] **Step 1: 在模板中改为展示 dict 的中文 label，并允许填写 dict_value**

更新 `importTemplate()` 的 header 文案，不再提示 `1/2/3`。

- [ ] **Step 2: importBatch 增加 normalizeType**

对 type 字段：
- 如果输入等于 dictValue：直接用
- 如果输入等于 dictLabel：转换成 dictValue
- 若是数字（旧版）：仅对 point.type 做有限映射（1->FLOW, 2->PRESSURE, 3->LEVEL, 4->QUALITY_CHLORINE, 5->QUALITY_TURBIDITY, 6->QUALITY_PH）
- 否则返回错误信息（包含行号与可选项）

- [ ] **Step 3: 验证**

Run:
```bash
cd /workspace/server && npm run build micro-water-basic
```

- [ ] **Step 4: Commit**

```bash
git add server/apps/micro-water-basic/src/module/equipment/point.service.ts \
  server/apps/micro-water-basic/src/module/equipment/device.service.ts \
  server/apps/micro-water-basic/src/module/equipment/station.service.ts \
  server/libs/common/src/entities/water-basic/water-point.entity.ts
git commit -m "fix: align import templates with dict values and normalize type mapping"
```

---

### Task 5: 前端站点搜索输入即搜 + 右侧展示优化

**Files:**
- Modify: `admin/src/views/water-basic/station-device-point/components/OverviewTab.vue`

- [ ] **Step 1: 输入即搜**

使用 debounce（项目已有 `@vueuse/core`）：

```js
import { useDebounceFn } from '@vueuse/core'
const handleSearchDebounced = useDebounceFn(handleSearch, 300)
```

模板 input 增加：

```vue
@input="handleSearchDebounced"
```

- [ ] **Step 2: 右侧展示区做 Header + skeleton/empty 优化**

重排右侧：增加 Header（站点名/编码/状态标签/刷新），empty 状态更紧凑。

- [ ] **Step 3: 验证**

Run:
```bash
cd /workspace/admin && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add admin/src/views/water-basic/station-device-point/components/OverviewTab.vue
git commit -m "feat: improve overview search UX and right panel UI"
```

---

### Task 6: Push

- [ ] **Step 1: Push all commits**

```bash
git push origin main
```

