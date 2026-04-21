# 实时数据接入（前端管理界面）实施计划

> **说明**：基础数据层与实时数据接入的后端核心（Task 1-5）已完成开发。本计划重点针对**数据接入独立微服务**的网关路由连通性以及**前端管理界面**进行实现。

**目标**：
完善并上线 `micro-data-integration` 数据接入微服务的前端管理界面。支持后台可视化配置数据源（定时读取DB、读取文件、Kafka等），配置字段映射解析，并提供用于测试的模拟产生设备数据的操作界面。

## 当前状态分析
- **后端实体与逻辑已就绪**：`DataSource`、`DataTask`、`DataMapping` 实体，以及相关的后端增删改查、定时任务调度、Kafka集成、TDengine时序数据写入逻辑已完成。
- **需要解决的路由问题**：`micro-data-integration` 当前 Controller 路径未统一增加 `data-integration` 前缀，导致 `api-gateway` (端口 8080) 无法将其路由到正确的微服务端口（3007）。
- **前端页面缺失**：缺少前端的 API 请求封装、Vue 视图组件，以及系统菜单路由的 SQL 脚本。

## 实施步骤 (Todos)

- [ ] **步骤 1：修复微服务 Controller 路径前缀**
  - 修改 `server/apps/micro-data-integration/src/config-mgr/config-mgr.controller.ts`，将 `@Controller('config')` 变更为 `@Controller('data-integration/config')`。
  - 修改 `server/apps/micro-data-integration/src/receiver/receiver.controller.ts`，将 `@Controller('receiver')` 变更为 `@Controller('data-integration/receiver')`。

- [ ] **步骤 2：配置 API Gateway 代理路由**
  - 修改 `server/apps/api-gateway/src/main.ts`，在反向代理的 `proxies` 数组中新增 `{ path: '/data-integration', target: 'http://127.0.0.1:3007' }`，确保前端请求可被转发。

- [ ] **步骤 3：编写菜单与路由 SQL 初始化脚本**
  - 创建 `server/db/1.3.0-data-integration-menu.sql`。
  - 在 `sys_menu` 表中插入主目录 "数据接入"，及三个子菜单："数据源配置"、"接入任务管理"、"数据模拟测试"。

- [ ] **步骤 4：封装前端 API 请求层**
  - 创建 `admin/src/api/data-integration/config.js`，包含对 `source`、`task`、`mapping` 的增删改查接口方法。
  - 创建 `admin/src/api/data-integration/receiver.js`，包含对模拟生成数据 `mock/generate` 接口的调用方法。

- [ ] **步骤 5：开发前端管理视图页面 (Vue 3 + Element Plus)**
  - 创建 `admin/src/views/data-integration/source/index.vue`：包含数据源列表的查询表格及新增/修改弹窗。
  - 创建 `admin/src/views/data-integration/task/index.vue`：包含任务管理的查询表格及新增/修改弹窗。同时提供“字段映射配置”弹窗，供用户将抓取到的源字段名对应到 TDengine 需要的 `deviceCode`, `pointCode`, `value`, `timestamp` 字段。
  - 创建 `admin/src/views/data-integration/mock/index.vue`：模拟产生设备数据工具页面。提供表单供用户输入测试的设备编码、指标编码及数值范围，一键产生并上报数据用于测试。
