# 数据库脚本收敛（bootstrap.sql）与 aggType 计算字段、导入模板规范

**目标**
- `server/db` 仅保留两份脚本：`init.sql`（仅手工执行、允许清库）与 `bootstrap.sql`（全量业务初始化、可被 db-updater 安全执行）。
- `water_point_type` 保持原有业务分类（PRESSURE/FLOW/LEVEL…）不动。
- 新增计算字段 `water_point.aggType`，用来决定“瞬时/累计/增长量”三类聚合与插值策略。
- 统一分区/站点/设备/测点导入模板：明确字段、必填、含义、允许值（字典速查），减少二次返工。

---

## 1. 背景与问题

当前 `server/db` 目录中存在大量分散的增量脚本，长期迭代后会出现：
- 版本顺序依赖文件名排序，脚本内容重复、覆盖、删除操作交叉，导致“初始化/升级”结果不确定。
- 误执行风险：db-updater 会自动执行目录下所有 `.sql`，一旦包含 DROP/清理语句将造成生产/测试数据破坏。
- 导入模板“字段含义不清晰、字典值填法不一致”，导致导入失败或数据类型混乱。

本次收敛目标为：**只支持全新初始化**（删库重建），通过合并脚本减少混乱与误操作。

---

## 2. `server/db` 收敛方案

### 2.1 文件结构
- 保留：`server/db/init.sql`
  - 特性：包含大量 `DROP TABLE` / `CREATE TABLE` / 初始化基础数据。
  - 执行方式：**仅允许手工执行**（MySQL 客户端 / Navicat），用于“全新初始化”。
- 新增：`server/db/bootstrap.sql`
  - 特性：全量业务初始化（菜单/字典/水务基础/数据集成 MySQL 表结构等），**不包含清库语句**。
  - 执行方式：可手工执行，也可由 db-updater 自动执行。
- 删除：`server/db/` 下除 `init.sql` 与 `bootstrap.sql` 外的所有 `.sql`。

### 2.2 db-updater 执行约束
- db-updater **必须跳过** `init.sql`，避免任何环境误清库。
- db-updater 默认执行 `bootstrap.sql`（以及未来新增的“安全增量脚本”，如明确只包含 `ALTER/INSERT` 等）。

---

## 3. `aggType` 计算字段设计

### 3.1 字段与字典
- 新增字段：`water_point.aggType`
- 新增字典类型：`water_point_agg_type`
  - `instantaneous`：瞬时（聚合 AVG + 插值 LINEAR）
  - `cumulative`：累计（聚合 LAST + 插值 PREV）
  - `incremental`：增长量/增量（聚合 SUM + 缺值补 0）

### 3.2 删除错误字典
删除并清理以下字典类型及其字典数据（包含重复数据）：
- `water_cumulative_point_type`
- `water_incremental_point_type`

### 3.3 聚合策略（TDengine 聚合表）
以 `aggType` 决定写入 `meters_5m/1h/1d` 的聚合值来源：
- `instantaneous`
  - 写入值：`AVG(val)` 到 `avg_val`
  - 缺值处理：`FILL(LINEAR)`
- `cumulative`
  - 写入值：`LAST(val)` 到 `avg_val`
  - 缺值处理：`FILL(PREV)`
- `incremental`
  - 写入值：`SUM(val)` 到 `avg_val`
  - 缺值处理：`FILL(VALUE, 0)`

说明：统一读取 `avg_val` 作为曲线展示/计算的“代表值”，避免不同类型读不同字段造成前端/接口复杂度提升。

---

## 4. 存量数据回填规则

上线后（或重建库后导入历史测点）必须保证 `aggType` 有值。
回填采用“业务分类（water_point_type）→ 聚合类型”映射，默认以用户提供映射为准：
- `FLOW / FLOW_INLET / FLOW_OUTLET / FLOW_TOTAL` → `cumulative`
- 其他现有类型默认 → `instantaneous`
- 若未来存在“区间增量”类（如降雨量、脉冲增量），在导入时直接填 `incremental`。

---

## 5. 导入模板规范（分区/站点/设备/测点）

### 5.1 模板结构（统一格式）
每个导入模板都采用 3 个 Sheet：
- Sheet1：`导入数据`
  - 列名标注：`(必填)`、格式要求、示例值
- Sheet2：`字段说明`
  - 字段名、是否必填、示例、含义、注意事项
- Sheet3：`字典速查`
  - 按模板涉及的 `dictType` 输出：`dict_label / dict_value`，用于填值对照

### 5.2 测点模板新增字段
测点导入模板新增列：
- `aggType(瞬时/累计/增长量，填写字典值)`：填 `instantaneous/cumulative/incremental`

---

## 6. 验收标准
- `server/db` 仅存在：`init.sql`、`bootstrap.sql`。
- db-updater 启动不会执行 `init.sql`。
- 系统字典中不存在 `water_cumulative_point_type`、`water_incremental_point_type`。
- 测点新增/编辑/导入均可正确维护 `aggType`，TDengine 聚合任务按 `aggType` 执行正确 SQL。
- 分区/站点/设备/测点导入模板均包含字段说明与字典速查，且前端导入解析无明显错误（不会“全部过滤为空”）。

