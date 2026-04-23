# 分区指标级联流计算与库内聚合架构 (Zone Aggregation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 TDengine 和 Redis 脏数据队列，实现设备测点向分区指标的自动化、无级联风暴的库内（SQL）流式聚合计算。

**Architecture:** 
1. **底层扩容**：修改设备 5m/1h/1d 的 TDengine 聚合逻辑，增加 `diff_val` 字段。针对累计流量使用 `DIFF(val)`，针对瞬时流量使用 `INTEGRAL(val)/3600000` 算出当期体积增量。
2. **异步触发**：设备层聚合完成后，查找受影响的分区与时间范围，将其推入 Redis 队列 `iot:zone_agg:dirty:set` 和 `iot:zone_agg:dirty:range:*` 进行合并去重。
3. **库内聚合**：新增 `TdengineZoneAggScheduler` 定时任务，消费分区脏数据队列。加载 MySQL/Redis 中的 `water_zone_metric_calc` 关联配置，动态拼接 `UNION ALL` 的 SQL，交由 TDengine 在库内完成最终的加减法合并，写入专门的 `zone_meters_5m` 等分区超级表。

**Tech Stack:** NestJS, TDengine 3.x, Redis (ioredis), TypeORM

---

### Task 1: 扩充底层测点聚合字段 (diff_val)

**Files:**
- Modify: `server/apps/micro-data-integration/src/tdengine/tdengine-agg.service.ts`
- Modify: `server/apps/micro-data-integration/src/tdengine/tdengine.service.ts`

- [ ] **Step 1: 修改 TDengine 超级表创建逻辑**
  在 `tdengine.service.ts` 中，修改 `initMetersSuperTable` 及其对应的 5m/1h/1d 超级表创建语句，增加 `diff_val DOUBLE` 字段。
  ```sql
  CREATE STABLE IF NOT EXISTS meters_5m (ts TIMESTAMP, val_avg DOUBLE, val_max DOUBLE, val_min DOUBLE, val_spread DOUBLE, diff_val DOUBLE) TAGS (device_code BINARY(50), point_code BINARY(50))
  ```

- [ ] **Step 2: 重构设备聚合计算 (rebuildAggTables)**
  在 `tdengine-agg.service.ts` 中，修改 `rebuildAggTables` 方法：
  - 如果 `kind === 'cumulative'`（如 `FLOW_TOTAL`），取 `DIFF(val)` 作为 `diff_val`。
  - 如果测点类型是瞬时流量（通过判断 `point.type` 是否包含 `INSTANT`、`INLET`、`OUTLET` 或字典中定义的瞬时类型），取 `INTEGRAL(val)/3600000` 作为 `diff_val`。
  - 其他类型 `diff_val` 填 `0`。

### Task 2: 建立分区超级表与子表维护逻辑

**Files:**
- Modify: `server/apps/micro-data-integration/src/tdengine/tdengine.service.ts`

- [ ] **Step 1: 初始化分区超级表**
  在 `tdengine.service.ts` 的 `onModuleInit` 中，增加分区超级表的创建逻辑：
  ```sql
  CREATE STABLE IF NOT EXISTS zone_meters_5m (ts TIMESTAMP, total_val DOUBLE) TAGS (zone_code BINARY(50), metric_type BINARY(50))
  -- 同理创建 1h, 1d 表
  ```

- [ ] **Step 2: 编写辅助方法获取分区子表名**
  增加辅助函数：`zoneChildTable(interval, zoneCode, metricType)`，用于返回形如 `z_5m_zone001_water_supply` 的合法表名。

### Task 3: 实现设备聚合后的 Redis 分区联动 (合并风暴)

**Files:**
- Modify: `server/apps/micro-data-integration/src/tdengine/tdengine-agg.scheduler.ts`

- [ ] **Step 1: 在设备脏数据处理完成后查找关联分区**
  在 `TdengineAggScheduler.handleDirtyData` 中，当某一批设备测点聚合完成后，通过 MySQL 或 Redis 缓存查询这些 `pointCode` 对应的 `water_zone_metric_calc` 配置。

- [ ] **Step 2: 推入分区脏数据队列**
  将受影响的 `zoneCode|metricType` 作为 Key 推入 `iot:zone_agg:dirty:set`，并在 `iot:zone_agg:dirty:range:{key}` 中更新合并 `dirtyStartMs` 和 `dirtyEndMs`。这部分逻辑可以完全复用设备脏队列的 `Math.min / Math.max` 算法，实现时间区间的无缝合并去重。

### Task 4: 新增分区定时聚合调度器 (Zone Aggregator)

**Files:**
- Create: `server/apps/micro-data-integration/src/tdengine/tdengine-zone-agg.scheduler.ts`
- Create: `server/apps/micro-data-integration/src/tdengine/tdengine-zone-agg.service.ts`
- Modify: `server/apps/micro-data-integration/src/tdengine/tdengine.module.ts`

- [ ] **Step 1: 创建 ZoneAggService**
  编写 `rebuildZoneAggTables(zoneCode, metricType, startMs, endMs)` 方法。
  - 从 `water_zone_metric_calc` 查出该分区该指标下的所有测点及其 `calcSign`。
  - 对 `5m`, `1h`, `1d` 分别循环拼接 `UNION ALL` SQL。
  - 执行 `INSERT INTO 分区子表 SELECT ts, SUM(val) FROM ( ... ) GROUP BY ts`。

- [ ] **Step 2: 创建 ZoneAggScheduler**
  编写定时任务（如 `@Cron('*/2 * * * *')`，每2分钟执行一次），消费 `iot:zone_agg:dirty:set`。
  - 取出队列中的分区任务，按 `zoneCode` 和 `metricType` 解析。
  - 调用 `ZoneAggService` 进行库内聚合。
  - 成功后从 Redis 队列中清除该记录。

- [ ] **Step 3: 注册 Module**
  将新的 Service 和 Scheduler 注册到 `TdengineAggModule` (或新建的模块) 中。
