# 项目架构与模块化开发规范 (Project Architecture & Modularization Rules)

## 1. 后端微服务与模块架构 (Backend Microservices)
我们的系统采用微服务架构（基于 NestJS），各个独立的业务模块应当作为一个独立的微服务存在。
例如：“智慧水务基础数据模块”将被创建为一个独立的微服务，避免与原有的系统管理模块等强耦合。
- 微服务存放路径：`server/apps/<micro-service-name>`
  - 例如：`server/apps/micro-water-basic`

## 2. 实体类与共享库 (Shared Entities & Libs)
为了避免多个微服务间重复编写实体类（Entity）、数据传输对象（DTO）或通用工具类，**所有数据库实体类（TypeORM Entities）必须放置在公共的 shared 库中**。
- 存放路径：`server/libs/shared/src/entities/<module-name>`
  - 例如：水务基础模块的实体应放在 `server/libs/shared/src/entities/water-basic/`

## 3. 前端模块划分 (Frontend Modules)
前端（Vue 3 + Element Plus）应当按照业务模块进行目录划分。每个独立的微服务在前端应有对应的顶级业务目录。
- 存放路径：`admin/src/views/<module-name>`
  - 例如：`admin/src/views/water-basic/`
- API 接口调用定义应放置在：`admin/src/api/<module-name>/`

## 4. 路由与菜单 (Routes & Menus)
新的模块需要通过 SQL 脚本初始化其菜单和路由，脚本统一放置在 `server/db/` 目录下，并按照版本号和功能命名（例如 `1.2.0-water-basic-menu.sql`）。系统启动时由 `db-updater` 服务自动执行。
