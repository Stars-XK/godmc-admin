# 分区管理「关联设备/关联营收」性能与模板优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化分区管理的“关联设备台账/关联营收基础”弹窗体验：操作列更宽、未关联列表后端分页（默认 20、最大 500）、提供后端生成的模板文件下载，并在 UI 中清晰解释“追加/替换”的区别。

**Architecture:** 后端为 `unbound/*/list` 改为分页 `getManyAndCount` 返回 `{ list, total }`；新增 `template` 下载接口用 `exceljs` 写入 Response；前端抽屉内表格增加分页与每页条数切换，下载模板按钮使用 `proxy.download()`，并补充模式说明与替换二次确认。

**Tech Stack:** NestJS + TypeORM + exceljs；Vue3 + Element Plus + xlsx（前端解析导入）+ 全局 `proxy.download`

---

## Files Overview

**Backend**
- Modify: [zone.service.ts](file:///workspace/server/apps/micro-water-basic/src/module/zone/zone.service.ts)
- Modify: [zone.controller.ts](file:///workspace/server/apps/micro-water-basic/src/module/zone/zone.controller.ts)

**Frontend**
- Modify: [ZoneBindDevice.vue](file:///workspace/admin/src/views/water-basic/zone/components/ZoneBindDevice.vue)
- Modify: [ZoneBindRevenue.vue](file:///workspace/admin/src/views/water-basic/zone/components/ZoneBindRevenue.vue)
- Modify: [index.vue](file:///workspace/admin/src/views/water-basic/zone/index.vue)
- Modify/Create: [zone-bind.js](file:///workspace/admin/src/api/water-basic/zone-bind.js)

---

### Task 1: 操作列宽度优化

**Files:**
- Modify: [index.vue](file:///workspace/admin/src/views/water-basic/zone/index.vue)

- [ ] 将“操作”列宽度从 300 调整到 380/420（以按钮不换行为准）。

---

### Task 2: 未关联列表后端分页（设备/营收）

**Files:**
- Modify: [zone.service.ts](file:///workspace/server/apps/micro-water-basic/src/module/zone/zone.service.ts)
- Modify: [zone.controller.ts](file:///workspace/server/apps/micro-water-basic/src/module/zone/zone.controller.ts)
- Modify: [zone-bind.js](file:///workspace/admin/src/api/water-basic/zone-bind.js)

- [ ] 统一入参：`pageNum`（默认 1）、`pageSize`（默认 20，服务端强制 `<= 500`）
- [ ] 设备未关联列表：`device.zoneCode IS NULL` + 模糊查询 + `skip/take` + `getManyAndCount()`，返回 `ResultData.ok({ list, total })`
- [ ] 营收未关联列表：`user.zoneCode IS NULL` + 模糊查询 + `skip/take` + `getManyAndCount()`，返回 `ResultData.ok({ list, total })`

---

### Task 3: 后端下载模板（设备/营收）

**Files:**
- Modify: [zone.service.ts](file:///workspace/server/apps/micro-water-basic/src/module/zone/zone.service.ts)
- Modify: [zone.controller.ts](file:///workspace/server/apps/micro-water-basic/src/module/zone/zone.controller.ts)

- [ ] 新增接口：
  - `POST /water-basic/zone/bind/device/template`
  - `POST /water-basic/zone/bind/revenue/template`
- [ ] 使用 `exceljs` 生成单 Sheet 文件：
  - 设备：列名 `设备编码`，可选填一行示例（如 `DEV001`）
  - 营收：列名 `用户编号`，可选填一行示例（如 `U0001`）
- [ ] 写入响应头并 `workbook.xlsx.write(res); res.end();`

---

### Task 4: 抽屉弹窗分页 + 模板下载 + 模式说明

**Files:**
- Modify: [ZoneBindDevice.vue](file:///workspace/admin/src/views/water-basic/zone/components/ZoneBindDevice.vue)
- Modify: [ZoneBindRevenue.vue](file:///workspace/admin/src/views/water-basic/zone/components/ZoneBindRevenue.vue)
- Modify: [zone-bind.js](file:///workspace/admin/src/api/water-basic/zone-bind.js)

- [ ] 列表展示：
  - 表格数据改用后端分页 `{ list, total }`
  - 增加分页组件：`v-model:page="pageNum"`、`v-model:limit="pageSize"`，默认 20，提供 `20/50/100/200/500`
  - 查询按钮重置页码为 1
  - `getList()` 使用 `try/finally` 确保 `loading=false`（防止卡死转圈）
- [ ] 模板下载：
  - “批量导入关联”Tab 中增加“下载模板”按钮
  - 通过 `proxy.download()` 调用后端 `template` 接口
- [ ] 模式说明：
  - 在单选框下方增加 `el-alert` 文案说明：
    - 追加：保留现有关联，只新增绑定
    - 替换：先清空该分区下所有现有关联，再绑定本次导入/勾选
  - 当用户选择 `replace` 并开始导入时，弹出二次确认（避免误操作）

---

### Task 5: 验证与提交

- [ ] 后端：`npm run build --prefix /workspace/server`
- [ ] 前端：`npm run build:prod --prefix /workspace/admin`
- [ ] 手动验证：
  - 打开“关联设备”抽屉：网络请求返回速度正常、分页可翻页
  - 下载模板：能下载 xlsx，列头正确
  - 导入 replace：提示二次确认，执行后返回结果可下载分析报告
- [ ] Git 提交并推送 main

