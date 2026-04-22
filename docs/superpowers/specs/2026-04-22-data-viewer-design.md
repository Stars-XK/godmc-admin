# 实时与历史数据可视化设计 (方案A & B)

## 业务需求
在物联网拓扑总览（方案B）和测点列表管理（方案A）中，提供多粒度（原始、5分钟、1小时、1天）的实时与历史数据可视化查询。支持动态切换数据粒度和查看最新状态。

## 核心架构设计

### 1. 后端查询接口设计 (`micro-data-integration`)
由于 TDengine 的多聚合表设计，需要根据不同的时间粒度，动态切换查询的表或视图。
新增两个接口，暴露于 `QueryController`：
- **`GET /api/data-integration/query/latest`**: 批量查询多个测点（或某设备下所有测点）的最新一条数据。
  - 参数: `deviceCode` (可选), `pointCodes` (逗号分隔)
  - 逻辑: 针对传入的测点，执行 `SELECT LAST_ROW(ts, val) FROM water_iot.d_${device}_${point}`，组合后返回最新值和时间戳。
- **`GET /api/data-integration/query/history`**: 查询指定测点在指定时间范围内的历史曲线。
  - 参数: `deviceCode`, `pointCode`, `startTime`, `endTime`, `interval` (raw, 5m, 1h, 1d)
  - 逻辑: 
    - `raw`: 查询 `water_iot.d_${device}_${point}`
    - `5m`: 查询 `water_iot.meters_5m`，按 `device_code` 和 `point_code` 过滤，返回 `avg_val`。
    - `1h`: 查询 `water_iot.meters_1h`
    - `1d`: 查询 `water_iot.meters_1d`

### 2. 前端公共组件抽离 (`admin/src/components/DataViewer`)
为了同时满足方案A（列表抽屉弹窗）和方案B（拓扑树右侧联动面板），我们需要把数据展示逻辑抽离为一个公共 Vue 组件 `<DataViewer />`。
- **Props**:
  - `viewType`: 'station' | 'device' | 'point'
  - `code`: 对应的编码
  - `name`: 对应的名称（用于标题显示）
- **内部逻辑**:
  - `viewType === 'station'`: 显示站点基本信息及下属设备数量。
  - `viewType === 'device'`: 调用 `latest` 接口，用卡片网格形式展示该设备下所有测点的最新数值及更新时间。
  - `viewType === 'point'`: 显示 ECharts 折线图。顶部提供 RadioGroup 切换粒度（原始、5分钟、1小时、1天），以及 DatePicker 选择时间范围（默认近 24 小时）。当粒度切换时，调用 `history` 接口重新渲染折线图。

### 3. 方案A实现 (列表中的弹窗)
- 在 `StationTab.vue`, `DeviceTab.vue`, `PointTab.vue` 的表格操作列中，新增一个“数据视图”按钮。
- 点击按钮，弹出一个全屏或大尺寸的 `<el-drawer>`。
- Drawer 内部引入并挂载 `<DataViewer viewType="..." code="..." />`。

### 4. 方案B实现 (拓扑总览联动)
- 在 `OverviewTab.vue` 中，改造右侧面板。
- 当 `treeData` 中没有选中任何节点时，保持现状（显示 3 个全局统计图）。
- 当点击左侧树某个节点时（触发 `node-click` 事件）：
  - 将选中的节点数据存入响应式变量 `selectedNode`。
  - 右侧面板通过 `v-if="selectedNode"` 隐藏全局统计图，转而渲染 `<DataViewer :viewType="selectedNode.nodeType" :code="selectedNode.code" />`。

## 后续实施步骤
1. **API 开发**: 在数据接入微服务完成 `latest` 和 `history` 两个 TDengine 查询接口。
2. **API 网关/前端联调**: 在网关放行路由，并在前端 `api/data-integration/query.js` 声明接口。
3. **公共组件开发**: 编写 `<DataViewer />` 组件及其对应的设备卡片和 ECharts 曲线逻辑。
4. **方案A集成**: 在各个设备资产列表（Tab）中加入 Drawer 和调用按钮。
5. **方案B集成**: 在 `OverviewTab.vue` 中加入树节点点击事件，右侧进行动态组件切换。