# 数据接入微服务与TDengine集成实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一个独立的数据接入微服务（`micro-data-integration`），支持多种协议（HTTP、定时DB、定时文件、Kafka）的实时数据接入，支持后台界面化配置字段映射解析，并提供模拟产生设备数据的接口，最终将标准化数据写入 TDengine 时序数据库。

**Architecture:** 
- **配置存储**: 使用现有的 MySQL 存储数据源配置、任务配置和字段映射规则。
- **调度与接入引擎**: 基于 NestJS，使用 `@nestjs/schedule` 实现动态定时任务（DB抽取、文件读取），集成 `kafkajs` 消费消息，暴露 HTTP API 接收推送。
- **时序存储**: 使用 `axios` 通过 TDengine REST API (或原生客户端) 初始化超级表并写入时序数据。
- **前端管理**: 在 Admin Vue 系统中新增可视化数据接入配置页面及模拟测试工具。

**Tech Stack:** NestJS, TypeORM, TDengine (REST API), KafkaJS, Vue3, Element Plus

---

### Task 1: 环境准备与微服务骨架搭建

**Files:**
- Modify: `/workspace/server/package.json`
- Modify: `/workspace/server/nest-cli.json`
- Create: `/workspace/server/apps/micro-data-integration/src/main.ts`
- Create: `/workspace/server/apps/micro-data-integration/src/micro-data-integration.module.ts`
- Create: `/workspace/server/apps/micro-data-integration/tsconfig.app.json`

- [ ] **Step 1: 安装必要依赖**
  在 `/workspace/server` 目录下执行：
  ```bash
  npm install kafkajs csv-parser
  npm install @types/kafkajs --save-dev
  ```

- [ ] **Step 2: 配置 `nest-cli.json` 与 `package.json`**
  在 `nest-cli.json` 的 `projects` 中注册 `micro-data-integration`。
  在 `package.json` 的 `scripts` 中增加 `"start:integration": "cross-env NODE_ENV=development SERVICE_NAME=micro-data-integration SERVICE_PORT=3007 nest start micro-data-integration --watch"`。并在 `start:all` 中追加该服务的启动命令。

- [ ] **Step 3: 创建微服务入口与模块**
  创建 `main.ts` 监听 `3007` 端口（或通过环境变量），创建基础的 `MicroDataIntegrationModule` 引入 `TypeOrmModule` 和配置。

---

### Task 2: 定义数据库实体 (配置层)

**Files:**
- Create: `/workspace/server/libs/common/src/entities/data-integration/data-source.entity.ts`
- Create: `/workspace/server/libs/common/src/entities/data-integration/data-task.entity.ts`
- Create: `/workspace/server/libs/common/src/entities/data-integration/data-mapping.entity.ts`
- Modify: `/workspace/server/libs/common/src/index.ts`

- [ ] **Step 1: 创建 DataSource 实体**
  包含字段：`id`, `name`, `type` (HTTP, MYSQL, POSTGRESQL, KAFKA, FILE), `connectionStr`, `username`, `password`。

- [ ] **Step 2: 创建 DataTask 实体**
  包含字段：`id`, `name`, `sourceId`, `cronExpression`, `querySqlOrTopic`, `status` (开启/停止)。

- [ ] **Step 3: 创建 DataMapping 实体**
  包含字段：`id`, `taskId`, `sourceField`, `targetField` (固定枚举: `deviceCode`, `pointCode`, `value`, `timestamp`)。

- [ ] **Step 4: 导出实体**
  在 `libs/common/src/index.ts` 中统一 export 这些实体。

---

### Task 3: TDengine 基础服务实现

**Files:**
- Create: `/workspace/server/apps/micro-data-integration/src/tdengine/tdengine.service.ts`
- Create: `/workspace/server/apps/micro-data-integration/src/tdengine/tdengine.module.ts`

- [ ] **Step 1: 创建 TdengineService**
  通过 HTTP REST (使用内置 `axios` 或 `HttpService`) 连接 TDengine (默认端口 `6041`)。

- [ ] **Step 2: 实现数据库与超级表初始化逻辑**
  编写方法 `initDatabaseAndSTable()`:
  - `CREATE DATABASE IF NOT EXISTS water_iot;`
  - `CREATE STABLE IF NOT EXISTS water_iot.meters (ts TIMESTAMP, val DOUBLE) TAGS (device_code BINARY(50), point_code BINARY(50));`

- [ ] **Step 3: 实现数据插入逻辑**
  编写方法 `insertData(deviceCode: string, pointCode: string, value: number, ts?: Date)`:
  - 自动创建子表: `CREATE TABLE IF NOT EXISTS water_iot.d_${deviceCode}_${pointCode} USING water_iot.meters TAGS ('${deviceCode}', '${pointCode}');`
  - 插入数据: `INSERT INTO water_iot.d_${deviceCode}_${pointCode} VALUES (NOW, ${value});` (如果提供了 `ts` 则使用指定时间)。

---

### Task 4: 模拟数据生成器与 HTTP 接收器

**Files:**
- Create: `/workspace/server/apps/micro-data-integration/src/receiver/receiver.controller.ts`
- Create: `/workspace/server/apps/micro-data-integration/src/receiver/receiver.service.ts`
- Create: `/workspace/server/apps/micro-data-integration/src/receiver/receiver.module.ts`

- [ ] **Step 1: 实现 Mock 数据生成 API**
  在 `ReceiverController` 中新增 `POST /mock/generate`。
  接收参数 `{ deviceCode, pointCode, min, max, count }`。
  在 `ReceiverService` 中循环生成随机数值，并调用 `TdengineService.insertData()`。

- [ ] **Step 2: 实现通用 HTTP 数据接收 API**
  新增 `POST /receiver/push/:taskId`。
  根据 `taskId` 查询对应的映射规则 (`DataMapping`)。
  解析 `req.body`，提取出设备编码、测点编码和数值，调用 `TdengineService.insertData()`。

---

### Task 5: 动态定时任务与 Kafka 引擎

**Files:**
- Create: `/workspace/server/apps/micro-data-integration/src/engine/task-scheduler.service.ts`
- Create: `/workspace/server/apps/micro-data-integration/src/engine/kafka-consumer.service.ts`
- Create: `/workspace/server/apps/micro-data-integration/src/engine/engine.module.ts`

- [ ] **Step 1: 实现定时任务调度器 (DB & 文件抽取)**
  引入 `@nestjs/schedule` 的 `SchedulerRegistry`。
  在 `TaskSchedulerService` 启动时，加载所有状态为“开启”的 DB 和 FILE 任务。
  使用 `mysql2` 或动态建立连接执行 SQL，或使用 `fs` 和 `csv-parser` 解析目录下的文件。
  将提取的结果通过映射规则写入 TDengine。

- [ ] **Step 2: 实现 Kafka 消费者集成**
  在 `KafkaConsumerService` 中，加载所有 KAFKA 类型的任务。
  使用 `kafkajs` 建立消费者，订阅对应 Topic。
  在 `eachMessage` 回调中解析 JSON，应用映射规则，写入 TDengine。

---

### Task 6: 前端管理界面开发

**Files:**
- Create: `/workspace/admin/src/api/data-integration/index.js`
- Create: `/workspace/admin/src/views/data-integration/source/index.vue`
- Create: `/workspace/admin/src/views/data-integration/task/index.vue`
- Create: `/workspace/admin/src/views/data-integration/mock/index.vue`

- [ ] **Step 1: 编写前端 API 接口**
  在 `admin/src/api/data-integration/index.js` 中封装针对 DataSource, DataTask, DataMapping 和 Mock 接口的 CRUD 请求。

- [ ] **Step 2: 开发数据源与任务配置页面**
  - `source/index.vue`: 标准的表格 CRUD，配置连接参数。
  - `task/index.vue`: 任务管理，并在编辑对话框中提供“字段映射表单”（允许用户添加源字段与目标 `deviceCode/pointCode/value` 的映射关系）。

- [ ] **Step 3: 开发模拟数据生成页面**
  - `mock/index.vue`: 表单选择分区、设备、测点（可复用之前的 `zone-bind` 树），填入期望的数值范围和生成数量，点击生成。显示生成进度或结果。
