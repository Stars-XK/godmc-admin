## 背景与目标

本次改造目标：

- 让 TDengine 聚合表 `meters_5m / meters_1h / meters_1d` 具备可用于二次计算（设备→分区、站点→分区等）的“补齐后”时序数据，插值结果落库，原始表 `meters` 不写插值点。
- 保持设备/站点/测点在线状态分钟级更新链路稳定可观测。
- 左侧站点搜索输入即搜（无需回车）。
- 优化站点树/站点列表右侧数据展示区域的视觉层级与交互体验。
- 统一站点/设备/测点导入模板与字典映射，解决“导入数值与字典值对不上”的问题。

## 现状概览（已确认）

- TDengine 原始表：`water_iot.meters(ts, val) TAGS(device_code, point_code)`。
- TDengine 聚合表：`water_iot.meters_5m/1h/1d(ts, avg_val, max_val, min_val, spread_val) TAGS(device_code, point_code)`。
- 现有聚合主要依赖 TDengine Stream；历史数据存在回填逻辑，但插值仅支持 `FILL(PREV)` 且策略不区分瞬时/累计。
- 状态链路：`micro-data-integration` 写 Redis 活跃时间 → `micro-monitor` 每分钟计算状态 → 事件 `water.status.batchUpdate` → `micro-water-basic` 落库。
- 字典存在两套脚本：旧版数值字典（1/2/3）与新版字符串字典（PRESSURE/FLOW/…），需要统一为字符串字典作为权威。

## 关键约束与决策

- 插值结果必须写入 `meters_5m/1h/1d`，供数据库侧二次计算直接使用。
- 插值策略：
  - 瞬时类测点：`avg_val` 用 `AVG(val)`，插值使用 `FILL(LINEAR)`。
  - 累计类测点：`avg_val` 用 `LAST(val)`，插值使用 `FILL(PREV)`（阶梯）。
  - 边界不外推：用户选定时间范围内，第一条数据之前与最后一条数据之后保持空（不写入补点）。
- 瞬时类曲线使用字段：`avg_val`。
- 瞬时/累计判定来源：water-basic 测点元数据（`dataType/pointType`，基于现有字典配置）。
- 字典值统一：数据库中存储字典值使用字符串常量（如 `PRESSURE`），导入模板对用户展示中文项（如“压力参数”），导入时由后端做字典映射。

## 设计方案

### 1) TDengine 聚合表插值落库（增量补算 + 自愈）

#### 1.1 总体思路

- 原始表 `meters` 永远只存真实数据点。
- 聚合表 `meters_5m/1h/1d` 作为可计算的物化视图：通过 TDengine `INTERVAL + FILL` 生成并落库。
- Stream 仅作为“实时预聚合/预热”，最终以“增量补算”结果为准，保证缺桶被补齐。

#### 1.2 dirty 触发与时间窗

- 当 `micro-data-integration` 成功写入 `meters` 后：
  - 记录该测点为 dirty（key 包含 `device_code + point_code`）。
  - 记录本次写入影响的时间范围 `[fromTs, toTs]`，用于后续只重算必要区间。

建议 Redis 数据结构：

- `iot:agg:dirty:set`：Set，元素为 `${deviceCode}|${pointCode}`
- `iot:agg:dirty:range:${deviceCode}|${pointCode}`：Hash，字段 `minTs/maxTs`（毫秒或 TDengine 支持的时间格式统一即可）

#### 1.3 定时增量补算任务

在 `micro-data-integration` 增加定时任务（分钟级）：

- 批量拉取 dirty 点位（可做分页/限量防止单轮过大）。
- 对每个点位、每个粒度（5m/1h/1d）执行“删除+插入”补算，SQL 仅由服务端拼装并发送到 TDengine REST，不做服务端计算。

补算数据源：

- 使用 TDengine 明细子表（现有逻辑已创建 `water_iot.d_${device}_${point}`）作为聚合来源。

瞬时类补算 SQL（示意）：

- `INSERT INTO water_iot.a5m_${device}_${point}`
  - `SELECT _wstart, AVG(val) AS avg_val, MAX(val) AS max_val, MIN(val) AS min_val, SPREAD(val) AS spread_val`
  - `FROM water_iot.d_${device}_${point}`
  - `WHERE ts BETWEEN ${from} AND ${to}`
  - `INTERVAL(5m) FILL(LINEAR)`

累计类补算 SQL（示意）：

- `INSERT INTO water_iot.a5m_${device}_${point}`
  - `SELECT _wstart, LAST(val) AS avg_val, LAST(val) AS max_val, LAST(val) AS min_val, 0 AS spread_val`
  - `FROM water_iot.d_${device}_${point}`
  - `WHERE ts BETWEEN ${from} AND ${to}`
  - `INTERVAL(5m) FILL(PREV)`

边界不外推：

- 在执行补算前先查该点位在 `[queryStart, queryEnd]` 内的 `firstTs/lastTs`。
- 实际补算窗口收缩为 `[max(from, firstTs), min(to, lastTs)]`；若窗口无效则不补算。

#### 1.4 数据库崩溃/恢复后的自愈

原则：原始数据不丢，聚合与插值可延迟但最终一致。

- 原始数据可靠性：
  - 若存在 Kafka 接入：consumer 在 TDengine 不可用时不提交 offset，恢复后重放写入，保证 `meters` 最终补齐。
  - 若非 Kafka：需配置重试策略与告警，确保写入失败可追溯与补写。
- 聚合自愈：
  - dirty 机制会在恢复后继续推动补算。
  - 增加“水位”避免重复大范围补算：每点位每粒度记录 `lastBackfillTs`（存 Redis 或 MySQL 均可）。

### 2) 状态更新链路（分钟级稳定与可观测）

目标：数据到达后分钟级内可反映到设备/站点状态，且问题可快速定位。

- 校验 Redis 配置一致性：
  - `micro-data-integration` 写活跃时间 hash（`iot:point:active`）的 Redis 实例/DB 与 `micro-monitor` 读取一致。
- 增加关键日志：
  - `micro-monitor` 每分钟：active 点数量、计算出的变化数量、emit payload 数量、emit 成功/失败。
  - `micro-water-basic` 消费 `water.status.batchUpdate`：接收数量、更新成功数量、耗时。
- 保持分钟级调度，不引入秒级事件驱动，降低耦合。

### 3) 站点搜索输入即搜

- OverviewTab 左侧搜索输入改为：
  - `@input` 触发搜索（300ms debounce）
  - `@clear` 立即搜索
  - 回车可保留为立即搜索但不依赖回车

### 4) 右侧数据展示样式优化（站点树右侧）

目标：右侧信息层级更清晰、更“产品化”，不改变数据能力。

- 顶部 Header：
  - 站点名称/编码、状态徽标（0 绿 / 1 黄 / 2 灰）、最后更新时间、刷新按钮。
- 内容区（设备列表）：
  - 卡片化列表（图标 + 状态点 + 名称/编码），选中态明显；支持滚动与搜索（可选）。
- 数据区（测点列表 + DataViewer）：
  - 左侧测点列表紧凑化，右侧为实时/历史视图；加载态 skeleton；空态更克制。

## 导入模板与字典统一方案

### 统一字典来源

- 以 `server/db/1.2.3-water-basic-new-dict.sql` 的字符串字典为权威：
  - `water_station_type`：如 `WATER_SUPPLY`、`MONITOR`、`WATER_PLANT` 等
  - `water_device_type`：如 `PUMP`、`VALVE`、`INSTRUMENT_PRESSURE` 等
  - `water_point_type`：如 `PRESSURE`、`FLOW`、`LEVEL`、`FLOW_TOTAL` 等

### 导入/导出字段规范（建议）

- Excel 模板对用户展示“中文 label”，上传时后端根据 `dict_type + dict_label` 或 `dict_type + dict_value` 映射：
  - 推荐支持两种输入：
    - 中文 label（更友好）
    - 字符串 dict_value（对接系统/脚本更稳）
- 数据库存储使用字符串 dict_value，不使用数字。

### 模板需要覆盖的关键列（站点/设备/测点）

- 站点：
  - `code`、`name`、`type`（字典：water_station_type）、`longitude`、`latitude`、`status`
- 设备：
  - `code`、`name`、`stationCode`、`type`（字典：water_device_type）、`status`
- 测点：
  - `code`、`name`、`deviceCode`、`pointType`（字典：water_point_type）、`dataType`（用于累计/瞬时判定）、`unit`、`status`

## 里程碑与验收

- 插值落库：
  - 写入稀疏数据（1天/3天一条）后，`meters_5m/1h/1d` 在有效窗口内补齐桶数据；
  - 瞬时类桶 `avg_val` 线性变化；累计类桶 `avg_val` 阶梯变化；
  - 边界不外推：窗口外不产生补点。
- 状态更新：
  - 新数据到达后 0~60 秒内设备/站点状态能变化并落库；
  - 关键日志可定位链路断点。
- 搜索体验：
  - 输入站点名称即开始过滤（debounce），无需回车。
- UI：
  - 右侧展示更清晰，空态/加载态不突兀。
- 导入模板：
  - 按模板导入站点/设备/测点后，前端字典显示正常（不再出现全部变成 PRESSURE 的情况）。

