# 🌊 微服务水务物联网后台管理系统 (GodMC Water IoT Admin)

![Vue 3](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)
![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)
![TDengine](https://img.shields.io/badge/TDengine-3.x-blue.svg)
![Microservices](https://img.shields.io/badge/Architecture-Microservices-orange.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

基于 **NestJS Monorepo + Vue 3 + TDengine + TCP 微服务** 构建的现代化水务物联网后台管理系统。该项目不仅包含完备的 RBAC 权限管理，还深度集成了水务物联网基础台账、设备实时状态引擎、时序数据流计算与大规模模拟数据生成等工业级物联网核心功能。

## ✨ 核心特性

- 🏭 **工业级时序数据处理**：深度集成 **TDengine** 时序数据库，支持海量物联网数据的极速写入与查询。
- 🔄 **智能流式聚合引擎**：内置自动化数据补算与流计算机制，支持瞬时、累计、增量等多种测点类型，自动完成 5分钟、1小时、1天的时序聚合与降采样。
- 🟢 **实时状态监控引擎**：基于 Redis 缓存实现设备活跃心跳检测，毫秒级判定站点、设备、测点的在线/离线/报警状态并自动反写回关系型数据库。
- 📊 **动态可视化分析**：结合 ECharts 封装高级数据看板，支持多维度历史曲线展示，内置智能断点算法（超过间隔阈值自动断开连线），精准还原数据真实连续性。
- 🧩 **高性能微服务架构**：采用 TCP 微服务通信机制，解耦 API 网关、系统基础、鉴权、水务台账、数据接入与状态监控等核心模块。
- 🏢 **完备的权限与业务台账**：继承并优化自若依(RuoYi)体系，支持细粒度的水务分区、站点、设备、测点及营收用户的一体化台账管理，支持 Excel 模板智能导出导入。

---

## 🏗 架构设计

本项目采用 **NestJS Monorepo** 模式管理服务端代码，通过 `api-gateway` 暴露 HTTP 接口，底层通过 TCP 与各业务微服务进行通信。

### 🧩 服务拆分
- **`api-gateway`** (端口: 8080): 核心 API 网关，负责 HTTP 路由、鉴权拦截验证、Swagger 文档生成，并代理请求至各个微服务。
- **`micro-auth`** (端口: 3001): 鉴权微服务。负责用户登录、登出、注册、验证码生成等。
- **`micro-system`** (端口: 3002): 系统核心微服务。负责用户、角色、菜单、部门、字典及参数配置。
- **`micro-monitor`** (端口: 3003): 监控与调度微服务。负责操作日志、状态引擎心跳检测及服务监控。
- **`micro-water-basic`** (端口: 3006): 水务基础台账微服务。负责水务分区、设备、测点、营收用户的管理及状态更新。
- **`micro-data-integration`** (端口: 3007): 数据集成与时序微服务。负责 TDengine 时序数据读写、流聚合计算、模拟数据生成及第三方数据接入。

### 🛠 技术栈
- **前端**: Vue 3 + Vite + Element Plus + ECharts
- **后端**: NestJS 10 + TypeORM + RxJS
- **中间件/数据库**: MySQL 8.0 + Redis 6.2 + TDengine 3.0
- **部署**: Docker Compose / PM2

---

## 🚀 快速开始

### 1. 环境准备
- Node.js (>= 18)
- MySQL 8.0 (无需手动导表，系统启动时会自动执行 `server/db` 下的初始化脚本)
- Redis (>= 6.0)
- TDengine (>= 3.0)

### 2. 配置修改
修改后端配置文件 `server/libs/common/src/config/dev.yml`，填入你的 MySQL、Redis 和 TDengine 连接信息。

### 3. 启动后端微服务
```bash
cd server
npm install

# 一键启动所有后端微服务及网关（推荐）
# 此命令使用 concurrently，会在同一终端用不同颜色区分不同服务的日志输出，极大地提升调试体验
npm run start:all
```

### 4. 启动前端控制台
```bash
cd admin
npm install
npm run dev
```
打开浏览器访问 `http://localhost:80` 即可进入系统。

---

## 📦 生产环境部署

服务端提供了 `ecosystem.config.cjs` 用于 PM2 一键拉起所有 Node.js 进程。
```bash
cd server
npm install

# 编译所有应用
npm run build api-gateway
npm run build micro-auth
npm run build micro-system
npm run build micro-monitor
npm run build micro-water-basic
npm run build micro-data-integration

# 使用 PM2 启动
pm2 start ecosystem.config.cjs
```

---

## 📁 目录结构

```text
├── admin/                          # 前端 Vue3 项目
│   ├── src/                        # 前端源代码
│   ├── vite.config.js              # Vite 配置
│   └── nginx.conf                  # Nginx 代理配置
├── server/                         # 后端 NestJS Monorepo
│   ├── apps/                       # 微服务与网关应用
│   │   ├── api-gateway/            # API 网关
│   │   ├── micro-water-basic/      # 水务台账微服务
│   │   ├── micro-data-integration/ # 时序与数据集成微服务
│   │   └── ...                     # 其他系统级微服务
│   ├── libs/                       # 共享依赖库 (@app/common)
│   ├── db/                         # 数据库自动升级 SQL 脚本
│   ├── ecosystem.config.cjs        # PM2 部署配置
│   └── package.json                # 后端依赖与启动脚本
└── README.md                       # 项目说明文档
```

---

## 🤝 贡献指南
欢迎提交 Pull Request 或 Issue 来改善此项目。如果你有任何好的想法或发现 Bug，请随时与我们联系！

## 📄 License
本项目基于 [MIT License](LICENSE) 开源。
