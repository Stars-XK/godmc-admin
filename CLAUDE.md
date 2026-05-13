# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

智慧水务物联网后台管理系统，基于 **NestJS Monorepo + Vue 3 + TDengine + TCP 微服务** 构建，继承自若依(RuoYi)体系。

## 常用命令

### 后端 (server/)

```bash
cd server
npm install

# 一键启动所有微服务（开发模式，concurrently 并行启动）
npm run start:all

# 单独启动网关（开发）
npm run start:dev

# 单独启动某个微服务
npm run start:water        # micro-water-basic (端口 3006)
npm run start:integration  # micro-data-integration (端口 3007)
npm run start:alarm        # micro-alarm (端口 3008)

# 编译
npm run build <服务名>           # 单个服务
npm run build:all                # 全部服务

# 测试
npm run test                    # 单元测试 (jest, 匹配 *.spec.ts)
npm run test:watch              # watch 模式
npm run test:cov                # 覆盖率
npm run test:e2e                # e2e 测试

# 代码检查与格式化
npm run lint                    # ESLint
npm run format                  # Prettier
```

### 前端 (admin/)

```bash
cd admin
npm install
npm run dev                     # 开发服务器 (端口 8888, 代理 /dev-api → localhost:8080)
npm run build:prod              # 生产构建
npm run build:stage             # staging 构建
```

### Docker Compose

```bash
docker-compose up               # 启动全部服务 (MySQL, Redis, 后端微服务, 前端 Nginx)
```

### PM2 生产部署

```bash
cd server
npm run build:all
pm2 start ecosystem.config.cjs
```

## 架构核心

### 服务通信模式

**两层通信机制：**
- **HTTP 代理**：`api-gateway/main.ts` 使用 `http-proxy-middleware` 按路径前缀将请求代理到各微服务的 HTTP 端口
- **TCP 微服务**：`api-gateway/src/microservices.module.ts` 注册了 `ClientsModule`（NestJS TCP Transport），供网关内部通过 `@Inject('MICRO_AUTH')` 等方式调用微服务。各微服务通过 `app.connectMicroservice({ transport: Transport.TCP, options: { port: 5xxx } })` 监听 TCP

**路由 → 服务映射**（见 `api-gateway/main.ts` proxies 数组）：

| 路径前缀 | 目标服务 | HTTP 端口 | TCP 端口 |
|---------|---------|----------|---------|
| `/login`, `/system/*` 等 | micro-system | 3002 | 5002 |
| `/auth/*` | micro-auth | 3001 | 5001 |
| `/monitor/*` | micro-monitor | 3003 | 5003 |
| `/water-basic/*` | micro-water-basic | 3006 | 5006 |
| `/data-integration/*`, `/report/*`, `/engine/*`, `/ingestion/*`, `/tdengine-agg/*` | micro-data-integration | 3007 | — |
| `/alarm/*` | micro-alarm | 3008 | — |

### 共享库

- **`@app/common`** (`libs/common/src`): 通用模块 — 实体(Entity)、装饰器(Decorator)、守卫(Guard)、过滤器、拦截器、DTO、工具函数。通过 `index.ts` 统一导出
- **`@app/shared`** (`libs/shared/src`): 基础设施 — 配置加载(`config/`)、Redis 模块、Axios 模块、`SharedModule`

tsconfig paths 别名：`@app/common` → `libs/common/src`，`@app/shared` → `libs/shared/src`

### 配置系统

配置文件位于 `server/libs/shared/src/config/`：
- `dev.yml` — 开发环境
- `prod.yml` — 生产环境

根据 `NODE_ENV` 自动选择，支持环境变量覆盖（`MYSQL_HOST`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `REDIS_HOST`, `REDIS_PASSWORD`）。

主要配置项：MySQL、Redis、TDengine、JWT、文件上传（本地/腾讯云COS）、权限白名单。

### 数据库

- **MySQL**：系统业务数据，启动时自动执行 `server/db/init.sql` 建表
- **Redis**：缓存、服务注册发现（`RegistryService` 每 10 秒心跳写 Redis，key 格式 `microservice:<name>:<host>:<port>`）
- **TDengine**：物联网时序数据（设备测点历史值、聚合数据）

TypeORM 配置中 `synchronize: false`，表结构通过 SQL 脚本管理。

### 认证与权限

三层全局守卫（`APP_GUARD`）：
1. `JwtAuthGuard` — JWT 验证 + 白名单路径放行（白名单在配置文件 `perm.router.whitelist` 中）
2. `RolesGuard` — 角色校验
3. `PermissionGuard` — 细粒度权限校验（菜单/按钮级别）

### 前端路由

基于若依的 RBAC 模式：
- `constantRoutes` — 公共路由（登录、注册、首页、GIS 大屏等）
- `dynamicRoutes` — 动态路由，由后端 `/getRouters` 接口根据用户权限动态加载
- `permission.js` — 路由守卫：有 token 时拉取用户信息和动态路由；无 token 时重定向登录页

前端的 API 代理：开发时 Vite 将 `/dev-api` 代理到 `http://localhost:8080`。

### micro-data-integration 核心模块

这是水务业务的核心服务，内部子模块：
- `tdengine/` — TDengine 连接与基础操作
- `tdengine/tdengine-agg.module` — 时序数据流聚合（5分钟/1小时/1天降采样）
- `receiver/` — 数据接收
- `engine/` — 实时状态引擎
- `query/` — 时序数据查询
- `config-mgr/` — 配置管理
- `report/` — 报表

### micro-water-basic 核心模块

水务基础台账管理：
- `module/zone/` — 水务分区
- `module/equipment/` — 设备管理
- `module/revenue/` — 营收用户

## Git 规范

提交信息必须使用中文，格式：`类型: [中文描述] 详细说明`

类型前缀：`feat`（新增）、`fix`（修复）、`refactor`（重构）、`docs`（文档）、`chore`（杂项）
