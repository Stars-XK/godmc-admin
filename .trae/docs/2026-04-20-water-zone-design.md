# 智慧水务基础数据模块 - 综合分区管理设计规范 (Water Zone Management Spec)

## 1. 概述 (Overview)
本项目旨在为智慧水务系统提供统一的**“综合分区管理”**基础模块。系统需要支持多种业务维度（如 DMA漏损、行政营业、控压、供水调度等）的分区划分，支持无限层级的树形嵌套，并与现有的 RBAC（基于部门的数据权限）深度结合。同时，提供强大的 Excel 导入导出功能以提升初始化效率。

## 2. 后端架构设计 (Backend Architecture)

### 2.1 微服务划分
- **服务名称**: `micro-water-basic`
- **端口**: 3003 (暂定)
- **代码位置**: `server/apps/micro-water-basic/`
- **职责**: 负责水务基础数据的 CRUD、权限过滤、Excel 导入解析及导出。

### 2.2 实体类设计 (Entities)
为保证共享性，实体类放置于 `server/libs/common/src/entities/water-basic/water-zone.entity.ts`，继承 `BaseEntity`。

**核心字段 (`water_zone`)**:
- **层级与分类**: `id`, `parent_id`, `ancestors`, `type` (1:行政, 2:DMA, 3:控压, 4:供水), `level` (层级1,2,3...)
- **基础信息**: `name`, `code` (唯一标识), `area` (面积), `population` (服务人口), `address` (位置描述)
- **权限与负责人**: `dept_id` (所属部门，用于数据权限过滤), `user_id` (负责人系统ID), `manager_name`, `manager_phone`
- **GIS 地理信息**: `longitude`, `latitude`, `boundary` (GeoJSON 边界坐标预留)
- **系统审计**: `sort`, `status`, `del_flag`, `create_by`, `create_time` 等（继承自 BaseEntity）

### 2.3 接口设计 (APIs)
- `GET /water-basic/zone/tree`: 获取指定 `type` 的分区树（包含数据权限过滤）
- `GET /water-basic/zone/list`: 获取分区列表
- `GET /water-basic/zone/:id`: 获取分区详情
- `POST /water-basic/zone`: 新增分区
- `PUT /water-basic/zone`: 修改分区
- `DELETE /water-basic/zone/:id`: 删除分区（需校验是否有子节点）
- **Excel 导入导出**:
  - `POST /water-basic/zone/import`: 批量导入 Excel 数据（支持指定父级节点 `parentId` 导入）
  - `POST /water-basic/zone/export`: 根据条件（包含数据权限过滤）导出分区数据（支持树形结构/平铺结构导出）
  - `GET /water-basic/zone/importTemplate`: 下载导入模板

## 3. 前端界面设计 (Frontend UI)

### 3.1 目录结构与组件拆分
为避免单文件过大，前端代码放置于 `admin/src/views/water-basic/zone/` 并进行组件拆分：
- `index.vue`: 主页面容器，包含顶部的 `type` 切换 Tab 和搜索表单。
- `components/ZoneTreeTable.vue`: 核心组件，使用 `el-table` 的树形数据展示（`row-key="id"`），包含行级操作按钮。
- `components/ZoneFormDialog.vue`: 新增/编辑分区的弹窗表单组件（包含所属部门、负责人的选择）。
- `components/ZoneImportDialog.vue`: Excel 导入弹窗组件（包含上传组件、指定导入父级节点的选择树、下载模板按钮）。

### 3.2 核心交互流
1. **树形展示**: 用户进入页面后，默认加载当前维度的顶级节点及子节点，以树状表格呈现。
2. **导入功能**: 用户点击“导入”，弹出 `ZoneImportDialog`。用户可选择将数据“导入为顶级节点”或“导入到指定分区下”（如选择某一级DMA，导入的Excel数据自动成为其二级DMA）。
3. **导出功能**: 结合顶部的搜索过滤条件（名称、状态等），将当前视图的数据导出为 Excel 文件。
4. **数据权限**: 列表和下拉树中的数据，均受到当前登录用户所属部门（`dept_id`）的数据权限约束。

## 4. 数据库初始化 (Database Init)
- 新增 `server/db/1.2.0-water-basic-zone.sql`
- 包含 `water_zone` 表的 DDL 语句。
- 包含将“水务基础数据”及“综合分区管理”菜单插入 `sys_menu` 表的 DML 语句。
