# Alarm Module (报警模块) Design Spec

## 1. 业务目标与概述
智慧水务报警模块（`micro-alarm`）是一个独立运行的微服务规则引擎。
它负责接收来自设备实时流、数据集成服务（夜小流量、产销差报表）的数据事件，利用积木式配置的轻量级 JSON 规则进行多维比对计算。当触发报警条件时，它会记录报警历史，并通过 WebSocket/SSE 将报警消息推送至前端进行右下角静默弹窗，同时为后续接入短信/工单系统预留扩展口。

## 2. 核心架构设计
1. **独立微服务基座**: 
   新建 `micro-alarm` 服务，内部嵌入 `json-rules-engine` 核心引擎，用于解析用户配置的 JSON 逻辑树。
2. **数据推拉结合 (Hybrid Data Flow)**:
   - **推 (Push)**: 设备原始时序数据写入 TDengine 时，通过 Redis Pub/Sub 将当前瞬时值推送给 `micro-alarm`。
   - **拉 (Pull)**: 夜间最小流量、产销差报表等复杂聚合任务在 `micro-data-integration` 计算完成后，发布 `AggTaskFinished` 事件。报警模块监听到后，主动根据配置规则去数据库/TDengine 拉取相关分区报表数据进行阈值计算（如：夜小流量 > 过去7天平均值 * 1.3）。
3. **全局离线静默拦截 (Graceful Degradation)**:
   - **前端拦截**: 在 `admin/src/utils/request.js` 的 Axios 响应拦截器中捕获 `502 / 504 / 503` 状态码（API 网关探测微服务离线）。
   - **交互处理**: 取消满屏飘红的 Error Message，改为右下角温柔弹窗（`ElNotification`），提示“XX 模块当前离线”，并直接返回空数据结构给业务页面，确保页面骨架不白屏。

## 3. 数据库表结构设计 (init.sql 扩展)

### 3.1 新增表
*   **`sys_alarm_rule` (报警规则配置表)**
    *   `rule_id` (主键)
    *   `rule_name` (规则名称，如：疑似爆管报警)
    *   `rule_type` (规则类型：1-设备级, 2-分区报表级, 3-系统资源级)
    *   `rule_conditions` (JSON 格式：存储前端积木组合出的 AND/OR 条件树)
    *   `rule_actions` (JSON 格式：触发动作，目前默认记录历史+弹窗，预留发短信/发工单的标记)
    *   `status` (启停状态: 0-启用, 1-停用)
    *   基础字段 (`remark`, `create_time`, `create_by` 等)
*   **`sys_alarm_history` (报警历史记录表)**
    *   `alarm_id` (主键)
    *   `rule_id` (关联规则 ID)
    *   `rule_name` (规则名称快照)
    *   `alarm_level` (报警级别: 1-紧急, 2-重要, 3-次要, 4-提示)
    *   `alarm_content` (动态生成的报警描述文案，如：XX分区夜小流量超出阈值30%)
    *   `alarm_time` (报警触发时间)
    *   `alarm_source` (报警源标识，如具体的 deviceCode 或 zoneCode)
    *   `status` (处理状态: 0-未处理, 1-已处理)
    *   `resolve_time`, `resolve_by`, `resolve_remark` (处理信息)

### 3.2 字典数据
*   `sys_alarm_level` (报警级别)
*   `sys_alarm_status` (报警处理状态)
*   `sys_alarm_rule_type` (规则类型)

### 3.3 菜单数据
*   在“系统监控”或新建顶级目录“报警中心”下增加子菜单：
    *   **报警规则配置** (`/alarm/rule`)
    *   **报警历史记录** (`/alarm/history`)

## 4. 前端页面与组件设计 (`admin`)
1.  **Axios 拦截器改造**: 修改 `utils/request.js` 处理网关异常。
2.  **积木式规则配置器 (Rule Builder)**: 
    *   在 `/alarm/rule` 页面，提供“选择数据源 -> 选择字段 -> 运算符 (>, <, =, 包含) -> 对比值 (固定值/动态变量)”的层级嵌套 UI。
3.  **报警历史列表**: 
    *   标准的分页查询表格页 (`/alarm/history`)，支持按时间、分区、处理状态检索，支持点击“处理”按钮填写处理备注消除报警。
4.  **全局 WebSocket 监听与弹窗**: 
    *   在前端主框架（如 `App.vue` 或 `layout`）中建立到后端的 Socket 连接。当收到报警事件时，触发带声音的右下角 `ElNotification`。

## 5. 后端微服务设计 (`micro-alarm`)
1.  **工程骨架**: 基于 NestJS 搭建新的 `micro-alarm` (监听独立端口，并在 API Gateway 注册路由)。
2.  **核心 Service**:
    *   `RuleService`: 负责报警规则的 CRUD。
    *   `EngineService`: 在内存中维护 `json-rules-engine` 实例，将数据库中的 `rule_conditions` 转化为引擎执行计划。
    *   `EventSubscriber`: 监听 Redis 的设备流数据和统计任务完成事件，组装 Fact（事实数据）并投入引擎运行。
    *   `HistoryService`: 当引擎 `on('success')` 命中规则时，向 `sys_alarm_history` 写入记录，并通过 Gateway 的 WebSocket 网关推送至前端。

## 6. 待确认或完善 (Self-Review 检查)
*   **工单与短信**: 目前设计仅写入历史和右下角弹窗，工单和短信在 `rule_actions` JSON 里仅做占位符预留，属于下阶段任务。
*   **性能考量**: Redis Pub/Sub 的吞吐量足以支撑中小规模智慧水务。如遇海量设备，后期可无缝切换至 Kafka 或利用 TDengine 的 Stream 计算功能触发 webhook，引擎层的处理逻辑无需大改。
*   **边界隔离**: `micro-alarm` 完全解耦，哪怕该微服务宕机，前端由于拦截器的存在不会白屏，基础数据采集（`micro-data-integration`）也不会受任何影响，符合微服务高可用设计。