# 智慧水务基础数据模块 - 综合分区管理实现计划 (Water Zone Management Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个支持多维度、无限层级嵌套，且深度集成数据权限和 Excel 导入导出的综合水务分区管理微服务及前端界面。

**Architecture:** 
1. 后端基于 NestJS 增加 `micro-water-basic` 微服务，实体类放在 `shared` 库，复用现存的基于 `dept_id` 的数据权限拦截器。
2. 前端基于 Vue 3 + Element Plus，组件拆分（主列表、表单弹窗、导入弹窗），使用树形表格展示数据。
3. 数据库通过 SQL 脚本初始化菜单和表结构。

**Tech Stack:** NestJS, TypeORM, Vue 3, Element Plus, MySQL.

---

### Task 1: 数据库与共享实体类准备

**Files:**
- Create: `server/db/1.2.0-water-basic-zone.sql`
- Create: `server/libs/common/src/entities/water-basic/water-zone.entity.ts`

- [ ] **Step 1: 编写数据库初始化脚本**
在 `server/db/1.2.0-water-basic-zone.sql` 中创建 `water_zone` 表结构及 `sys_menu` 菜单插入语句。

- [ ] **Step 2: 编写共享实体类**
在 `server/libs/common/src/entities/water-basic/water-zone.entity.ts` 中创建 `WaterZoneEntity`，继承 `BaseEntity`，定义所有核心字段（含 `deptId`、`ancestors` 等）。

- [ ] **Step 3: 导出实体类**
在 `server/libs/common/src/entities/index.ts` (如存在) 中导出该实体。

- [ ] **Step 4: Commit**
```bash
git add server/db/1.2.0-water-basic-zone.sql server/libs/common/src/entities/water-basic/water-zone.entity.ts
git commit -m "feat: [新增] 水务分区数据库脚本与共享实体类"
```

### Task 2: 后端微服务骨架与 CRUD 接口

**Files:**
- Create: `server/apps/micro-water-basic/src/main.ts`
- Create: `server/apps/micro-water-basic/src/app.module.ts`
- Create: `server/apps/micro-water-basic/src/module/zone/zone.module.ts`
- Create: `server/apps/micro-water-basic/src/module/zone/zone.controller.ts`
- Create: `server/apps/micro-water-basic/src/module/zone/zone.service.ts`

- [ ] **Step 1: 搭建微服务基础模块**
创建 `micro-water-basic` 的入口文件和 AppModule，配置 TypeORM 连接（引入 `WaterZoneEntity`）。

- [ ] **Step 2: 编写 Service (树形与 CRUD)**
在 `zone.service.ts` 中实现：构建树形结构（`getTree`）、新增（处理 `ancestors`）、修改、删除（校验子节点）。
**注意**: 在查询时必须通过 `ReqUser` 获取当前登录用户的 `deptId`，并拼接 SQL 或 QueryBuilder 加上数据权限过滤条件（如无现有拦截器装饰器，则手动拼接 `dept_id` 条件）。

- [ ] **Step 3: 编写 Controller**
在 `zone.controller.ts` 暴露 RESTful 接口。

- [ ] **Step 4: Commit**
```bash
git add server/apps/micro-water-basic/
git commit -m "feat: [新增] 水务分区微服务及CRUD接口"
```

### Task 3: 后端 Excel 导入导出功能

**Files:**
- Modify: `server/apps/micro-water-basic/src/module/zone/zone.controller.ts`
- Modify: `server/apps/micro-water-basic/src/module/zone/zone.service.ts`

- [ ] **Step 1: 实现导出接口**
在 Service 中实现 `export` 方法，根据传入的 `type` 和查询条件（含数据权限）查出数据，转换为 Excel Buffer 返回。

- [ ] **Step 2: 实现导入模板下载**
提供标准的包含必填项（名称、编码、上级ID等）的模板下载接口。

- [ ] **Step 3: 实现导入逻辑**
接收 Excel 文件和可选的 `parentId`。解析数据后，遍历插入。如果指定了 `parentId`，则所有导入顶级节点的 `parent_id` 均设置为该值，并更新对应的 `ancestors`。

- [ ] **Step 4: Commit**
```bash
git commit -am "feat: [新增] 水务分区Excel导入导出接口"
```

### Task 4: 前端 API 定义与主视图框架

**Files:**
- Create: `admin/src/api/water-basic/zone.js`
- Create: `admin/src/views/water-basic/zone/index.vue`

- [ ] **Step 1: 定义 API**
在 `zone.js` 中导出获取树、增删改查、导入导出的 axios 请求方法。

- [ ] **Step 2: 编写主视图页面**
在 `index.vue` 中实现顶部的搜索表单（包含名称、编码过滤，以及分区类型 `type` 的切换）。
包含操作按钮区（新增、导入、导出、展开/折叠）。

- [ ] **Step 3: Commit**
```bash
git add admin/src/api/water-basic/ admin/src/views/water-basic/zone/index.vue
git commit -m "feat: [新增] 分区管理前端API与主框架"
```

### Task 5: 前端树形表格与组件拆分

**Files:**
- Create: `admin/src/views/water-basic/zone/components/ZoneTreeTable.vue`
- Create: `admin/src/views/water-basic/zone/components/ZoneFormDialog.vue`
- Create: `admin/src/views/water-basic/zone/components/ZoneImportDialog.vue`
- Modify: `admin/src/views/water-basic/zone/index.vue`

- [ ] **Step 1: 编写 ZoneTreeTable 组件**
使用 `el-table` 设置 `row-key="id"` 展示树形数据。包含操作列（新增下级、修改、删除）。

- [ ] **Step 2: 编写 ZoneFormDialog 组件**
实现表单弹窗，包含 `el-tree-select` 选择上级分区、所属部门选择、负责人选择等字段。

- [ ] **Step 3: 编写 ZoneImportDialog 组件**
实现基于 `el-upload` 的导入组件。提供“下载模板”按钮。提供 `el-tree-select` 允许用户“选择导入到指定上级分区下”。

- [ ] **Step 4: 整合到主页面**
在 `index.vue` 中引入这三个组件，通过 props 和 emit 串联业务流。

- [ ] **Step 5: Commit**
```bash
git add admin/src/views/water-basic/zone/components/
git commit -m "feat: [新增] 分区管理前端树形表格与导入弹窗组件"
```
