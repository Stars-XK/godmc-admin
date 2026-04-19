# 微服务后台管理系统 (GodMC Admin)

基于 NestJS Monorepo + Vue 3 构建的现代化微服务后台管理系统。该项目由单体架构重构而来，采用 TCP 微服务通信机制，具有高性能、易扩展、容器化部署等特点。

## 🏗 架构设计

本项目采用 **NestJS Monorepo** 模式管理服务端代码，通过 `api-gateway` 暴露 HTTP 接口，底层通过 TCP 与各业务微服务进行通信。

### 服务拆分
- **`api-gateway`** (端口: 8080): 核心 API 网关，负责 HTTP 路由、鉴权拦截验证、Swagger 文档生成，并代理请求至各个微服务。
- **`micro-auth`** (端口: 3001): 鉴权微服务。负责用户登录、登出、注册、验证码生成等。
- **`micro-system`** (端口: 3002): 系统核心微服务。负责用户、角色、菜单、部门、岗位、字典、参数配置及公告管理。
- **`micro-monitor`** (端口: 3003): 监控与调度微服务。负责操作日志、登录日志、定时任务（`@Task`引擎）、缓存监控、在线用户及服务监控。
- **`micro-upload`** (端口: 3004): 上传微服务。处理文件及图片上传。
- **`micro-tools`** (端口: 3005): 工具微服务。提供代码生成器与模板处理引擎。
- **`@app/common`**: 公共业务依赖库。包含工具类 (Utils)、装饰器 (Decorators)、数据库实体 (Entities) 和拦截器等。
- **`@app/shared`**: 公共基础设施库。包含全局配置模块 (Config)、Redis 缓存服务集成以及统一的 Axios 请求服务。

### 技术栈
- **前端**: Vue 3 + Vite + Element Plus (基于若依/RuoYi体系)
- **后端**: NestJS 10 + TypeORM + RxJS
- **中间件**: MySQL 8.0 + Redis 6.2
- **部署**: Docker Compose / PM2

## 🚀 快速开始

### 方式一：Docker 一键部署（推荐）
项目根目录已提供完整的 `docker-compose.yml` 编排文件，包含前端 Nginx、后端网关、5个微服务以及 MySQL 和 Redis 容器。

```bash
# 在项目根目录下执行
docker-compose up -d --build
```
启动后：
- 前端访问地址: `http://localhost:80`
- 网关 API 地址: `http://localhost:8080` (通过前端 Nginx 的 `/dev-api/` 前缀代理)
- MySQL: `localhost:3306` (密码: root)
- Redis: `localhost:6379`

### 方式二：本地开发运行

**1. 环境准备**
- Node.js (>= 18)
- MySQL 8.0 (导入 `server/db/init.sql` 初始化数据库，注意检查配置的库名)
- Redis 

**2. 配置数据库与 Redis**
修改 `server/libs/shared/src/config/dev.yml` 文件中的数据库与 Redis 连接信息。

**3. 启动服务端**
```bash
cd server
npm install

# 一键启动所有后端微服务及网关（推荐）
# 🚀 跨平台支持：Windows、macOS、Linux 均可完美运行！
# 🎨 此命令使用 concurrently，会在同一终端用不同颜色区分不同服务的日志输出，方便调试
npm run start:all

# 或者可以分别打开多个终端单独启动（不推荐）
# npm run start:dev api-gateway
# npm run start:dev micro-auth
# npm run start:dev micro-system
# npm run start:dev micro-monitor
# npm run start:dev micro-upload
# npm run start:dev micro-tools
```

**4. 启动前端**
```bash
cd admin
npm install
npm run dev
```

### 方式三：PM2 生产环境部署
服务端提供了 `ecosystem.config.cjs` 用于 PM2 一键拉起所有 Node.js 进程。
```bash
cd server
npm install

# 编译所有应用
npm run build api-gateway
npm run build micro-auth
npm run build micro-system
npm run build micro-monitor
npm run build micro-upload
npm run build micro-tools

# 使用 PM2 启动
pm2 start ecosystem.config.cjs
```

## 📂 目录结构

```text
├── admin/                          # 前端 Vue3 项目
│   ├── src/                        # 前端源代码
│   ├── vite.config.js              # Vite 配置
│   ├── nginx.conf                  # Nginx 代理配置
│   └── Dockerfile                  # 前端 Nginx 构建镜像
├── server/                         # 后端 NestJS Monorepo
│   ├── apps/                       # 微服务与网关应用
│   │   ├── api-gateway/            # API 网关
│   │   ├── micro-auth/             # 鉴权微服务
│   │   ├── micro-monitor/          # 监控微服务
│   │   ├── micro-system/           # 系统微服务
│   │   ├── micro-tools/            # 工具微服务
│   │   └── micro-upload/           # 上传微服务
│   ├── libs/                       # 共享依赖库
│   │   ├── common/                 # @app/common (实体、工具类等)
│   │   └── shared/                 # @app/shared (配置、Redis等基础设施)
│   ├── db/                         # 数据库初始化 SQL
│   ├── ecosystem.config.cjs        # PM2 部署配置
│   ├── nest-cli.json               # Nest CLI 工作区配置
│   └── Dockerfile                  # 后端微服务构建镜像
├── docker-compose.yml              # 整体容器化编排文件
└── README.md                       # 项目说明文档
```
