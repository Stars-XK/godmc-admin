# 实时与历史数据可视化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 开发后端的 TDengine 查询接口并编写前端 `<DataViewer>` 公共组件，在设备/测点列表以及拓扑总览中展示实时与历史数据。

**Architecture:** 
1. `micro-data-integration` 提供 `latest` 和 `history` 接口，根据时间粒度动态切换 TDengine 超级表查询。
2. `api-gateway` 放行相关路由。
3. 前端封装 `DataViewer.vue` 组件，根据传入的 `viewType` (station/device/point) 显示不同的可视化面板。
4. 改造 `StationTab.vue`, `DeviceTab.vue`, `PointTab.vue` 和 `OverviewTab.vue` 接入该组件。

**Tech Stack:** NestJS, TDengine, Vue 3, ECharts

---

### Task 1: 后端查询接口开发

**Files:**
- Modify: `server/apps/micro-data-integration/src/query/query.controller.ts`
- Modify: `server/apps/micro-data-integration/src/query/query.service.ts`
- Modify: `server/apps/api-gateway/src/config/index.ts`

- [ ] **Step 1: 在 `query.service.ts` 增加 `getLatestData` 和 `getHistoryData`**

```typescript
  async getLatestData(deviceCode?: string, pointCodes?: string) {
    let sql = `SELECT LAST_ROW(ts, val), device_code, point_code FROM water_iot.meters WHERE 1=1`;
    if (deviceCode) {
      sql += ` AND device_code = '${deviceCode.replace(/-/g, '_').toLowerCase()}'`;
    }
    if (pointCodes) {
      const codes = pointCodes.split(',').map(c => `'${c.replace(/-/g, '_').toLowerCase()}'`).join(',');
      sql += ` AND point_code IN (${codes})`;
    }
    sql += ` GROUP BY device_code, point_code`;
    
    const res = await this.tdengineService.querySql(sql);
    const result = [];
    if (res && res.data) {
      res.data.forEach(row => {
        result.push({
          ts: row[0],
          val: row[1],
          deviceCode: row[2],
          pointCode: row[3]
        });
      });
    }
    return result;
  }

  async getHistoryData(deviceCode: string, pointCode: string, startTime: string, endTime: string, interval: string = 'raw') {
    const safeDevice = deviceCode.replace(/-/g, '_').toLowerCase();
    const safePoint = pointCode.replace(/-/g, '_').toLowerCase();
    let tableName = `water_iot.d_${safeDevice}_${safePoint}`;
    let valColumn = 'val';

    if (interval === '5m') {
      tableName = `water_iot.meters_5m`;
      valColumn = 'avg_val';
    } else if (interval === '1h') {
      tableName = `water_iot.meters_1h`;
      valColumn = 'avg_val';
    } else if (interval === '1d') {
      tableName = `water_iot.meters_1d`;
      valColumn = 'avg_val';
    }

    let sql = `SELECT ts, ${valColumn} as val FROM ${tableName} WHERE ts >= '${startTime}' AND ts <= '${endTime}'`;
    if (interval !== 'raw') {
      sql += ` AND device_code = '${safeDevice}' AND point_code = '${safePoint}'`;
    }
    sql += ` ORDER BY ts ASC LIMIT 10000`;

    const res = await this.tdengineService.querySql(sql);
    const result = [];
    if (res && res.data) {
      res.data.forEach(row => {
        result.push({ ts: row[0], val: row[1] });
      });
    }
    return result;
  }
```

- [ ] **Step 2: 在 `query.controller.ts` 中暴露接口**

```typescript
  @Get('latest')
  async getLatestData(@Query('deviceCode') deviceCode: string, @Query('pointCodes') pointCodes: string) {
    const data = await this.queryService.getLatestData(deviceCode, pointCodes);
    return ResultData.ok(data);
  }

  @Get('history')
  async getHistoryData(
    @Query('deviceCode') deviceCode: string, 
    @Query('pointCode') pointCode: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('interval') interval: string
  ) {
    if (!deviceCode || !pointCode || !startTime || !endTime) {
      return ResultData.fail(500, '缺少必要参数');
    }
    const data = await this.queryService.getHistoryData(deviceCode, pointCode, startTime, endTime, interval);
    return ResultData.ok(data);
  }
```

- [ ] **Step 3: 网关放行路由**

在 `server/apps/api-gateway/src/config/index.ts` 的 `whiteList` 中加入:
```typescript
'/api/data-integration/query/latest',
'/api/data-integration/query/history',
```

- [ ] **Step 4: Commit**

```bash
git add server/apps/micro-data-integration/src/query/query.controller.ts server/apps/micro-data-integration/src/query/query.service.ts server/apps/api-gateway/src/config/index.ts
git commit -m "feat: [数据接入] 新增测点实时数据与多粒度历史曲线查询接口"
```

---

### Task 2: 前端公共组件 `<DataViewer>` 开发

**Files:**
- Create: `admin/src/components/DataViewer/index.vue`
- Modify: `admin/src/api/data-integration/query.js`

- [ ] **Step 1: 声明前端 API**

```javascript
// admin/src/api/data-integration/query.js
import request from '@/utils/request'

export function getLatestData(query) {
  return request({
    url: '/data-integration/query/latest',
    method: 'get',
    params: query
  })
}

export function getHistoryData(query) {
  return request({
    url: '/data-integration/query/history',
    method: 'get',
    params: query
  })
}
```

- [ ] **Step 2: 编写 DataViewer.vue 基础框架与历史曲线**

```html
<!-- admin/src/components/DataViewer/index.vue -->
<template>
  <div class="data-viewer-container">
    <!-- 站点视图 -->
    <div v-if="viewType === 'station'" class="station-view">
      <el-empty description="请在左侧点击设备或测点查看详细数据"></el-empty>
    </div>

    <!-- 设备视图 -->
    <div v-if="viewType === 'device'" class="device-view">
      <div class="view-header">
        <h3>{{ name }} - 实时感知数据</h3>
        <el-button type="primary" link icon="Refresh" @click="fetchLatest">刷新</el-button>
      </div>
      <el-row :gutter="20" v-loading="loading">
        <el-col :span="8" v-for="(item, index) in latestData" :key="index" style="margin-bottom: 20px;">
          <el-card shadow="hover" class="point-card">
            <div class="point-title">{{ item.pointCode }}</div>
            <div class="point-value">{{ item.val }}</div>
            <div class="point-time">{{ item.ts }}</div>
          </el-card>
        </el-col>
        <el-col :span="24" v-if="latestData.length === 0 && !loading">
          <el-empty description="暂无感知数据"></el-empty>
        </el-col>
      </el-row>
    </div>

    <!-- 测点视图 -->
    <div v-if="viewType === 'point'" class="point-view">
      <div class="view-header">
        <h3>{{ name }} - 历史数据曲线</h3>
      </div>
      <div class="toolbar">
        <el-radio-group v-model="historyParams.interval" @change="fetchHistory" size="small">
          <el-radio-button label="raw">原始</el-radio-button>
          <el-radio-button label="5m">5分钟</el-radio-button>
          <el-radio-button label="1h">1小时</el-radio-button>
          <el-radio-button label="1d">日统计</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          @change="handleDateChange"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="margin-left: 15px;"
        />
        <el-button type="primary" size="small" icon="Refresh" style="margin-left: 15px;" @click="fetchHistory">刷新</el-button>
      </div>
      <div v-loading="loading" class="chart-box" ref="chartRef"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getLatestData, getHistoryData } from '@/api/data-integration/query'
import * as echarts from 'echarts'

const props = defineProps({
  viewType: { type: String, required: true }, // 'station' | 'device' | 'point'
  code: { type: String, required: true },
  name: { type: String, default: '' },
  parentCode: { type: String, default: '' } // 仅测点需要 deviceCode
})

const loading = ref(false)
const latestData = ref([])
const dateRange = ref([])
const historyParams = ref({ interval: 'raw' })

const chartRef = ref(null)
let chartInstance = null

// 初始化时间范围（默认近 24 小时）
function initDateRange() {
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 3600 * 1000 * 24)
  
  const format = (d) => {
    const pad = (n) => n < 10 ? '0' + n : n
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  
  dateRange.value = [format(start), format(end)]
}

async function fetchLatest() {
  if (!props.code) return
  loading.value = true
  try {
    const res = await getLatestData({ deviceCode: props.code })
    latestData.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleDateChange() {
  fetchHistory()
}

async function fetchHistory() {
  if (!props.code || !props.parentCode || !dateRange.value || dateRange.value.length < 2) return
  loading.value = true
  try {
    const res = await getHistoryData({
      deviceCode: props.parentCode,
      pointCode: props.code,
      startTime: dateRange.value[0],
      endTime: dateRange.value[1],
      interval: historyParams.value.interval
    })
    renderChart(res.data || [])
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function renderChart(dataList) {
  if (!chartRef.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)
  
  const times = dataList.map(item => {
    const d = new Date(item.ts)
    return `${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes() < 10 ? '0'+d.getMinutes() : d.getMinutes()}`
  })
  const values = dataList.map(item => item.val)

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: times },
    yAxis: { type: 'value' },
    series: [
      {
        name: '数值',
        type: 'line',
        smooth: true,
        data: values,
        areaStyle: { opacity: 0.1 }
      }
    ]
  }
  chartInstance.setOption(option)
}

function handleResize() {
  if (chartInstance) chartInstance.resize()
}

watch(() => props.code, (newVal) => {
  if (newVal) {
    if (props.viewType === 'device') {
      fetchLatest()
    } else if (props.viewType === 'point') {
      if(dateRange.value.length === 0) initDateRange()
      nextTick(() => fetchHistory())
    }
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) chartInstance.dispose()
})
</script>

<style scoped>
.data-viewer-container {
  height: 100%;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.view-header h3 {
  margin: 0;
  color: #303133;
}
.point-card {
  text-align: center;
}
.point-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}
.point-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 10px;
}
.point-time {
  font-size: 12px;
  color: #C0C4CC;
}
.toolbar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}
.chart-box {
  width: 100%;
  height: 400px;
}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/api/data-integration admin/src/components/DataViewer
git commit -m "feat: [前端] 封装 DataViewer 公共组件实现实时卡片与多粒度历史曲线渲染"
```

---

### Task 3: 方案A - 列表接入 Drawer 与 DataViewer

**Files:**
- Modify: `admin/src/views/water-basic/station-device-point/components/DeviceTab.vue`
- Modify: `admin/src/views/water-basic/station-device-point/components/PointTab.vue`

- [ ] **Step 1: `DeviceTab.vue` 增加 Drawer**

在 `</el-row>` 闭合标签后，加入 Drawer 和 `DataViewer`。

```html
    <!-- 数据视图抽屉 -->
    <el-drawer v-model="drawerOpen" :title="drawerTitle" size="50%">
      <DataViewer v-if="drawerOpen" viewType="device" :code="drawerCode" :name="drawerName" />
    </el-drawer>
```
在 script 中引入并定义状态：
```javascript
import DataViewer from '@/components/DataViewer/index.vue'

// ... 
const drawerOpen = ref(false)
const drawerTitle = ref('')
const drawerCode = ref('')
const drawerName = ref('')

function handleDataView(row) {
  drawerCode.value = row.code
  drawerName.value = row.name
  drawerTitle.value = `设备数据视图 - ${row.name}`
  drawerOpen.value = true
}
```
在操作列加入按钮：
```html
<el-button link type="success" icon="DataLine" @click="handleDataView(scope.row)">数据视图</el-button>
```

- [ ] **Step 2: `PointTab.vue` 增加 Drawer**

在 `</el-row>` 闭合标签后，加入 Drawer 和 `DataViewer`。

```html
    <!-- 数据视图抽屉 -->
    <el-drawer v-model="drawerOpen" :title="drawerTitle" size="60%">
      <DataViewer v-if="drawerOpen" viewType="point" :code="drawerCode" :parentCode="drawerDeviceCode" :name="drawerName" />
    </el-drawer>
```
在 script 中引入并定义状态：
```javascript
import DataViewer from '@/components/DataViewer/index.vue'

// ...
const drawerOpen = ref(false)
const drawerTitle = ref('')
const drawerCode = ref('')
const drawerDeviceCode = ref('')
const drawerName = ref('')

function handleDataView(row) {
  drawerCode.value = row.code
  drawerDeviceCode.value = row.deviceCode
  drawerName.value = row.name
  drawerTitle.value = `测点数据视图 - ${row.name}`
  drawerOpen.value = true
}
```
在操作列加入按钮：
```html
<el-button link type="success" icon="DataLine" @click="handleDataView(scope.row)">数据视图</el-button>
```

- [ ] **Step 3: Commit**

```bash
git add admin/src/views/water-basic/station-device-point/components/DeviceTab.vue admin/src/views/water-basic/station-device-point/components/PointTab.vue
git commit -m "feat: [前端] 设备与测点列表增加数据视图抽屉"
```

---

### Task 4: 方案B - 拓扑总览联动接入

**Files:**
- Modify: `admin/src/views/water-basic/station-device-point/components/OverviewTab.vue`

- [ ] **Step 1: 引入组件与状态**

在 `script` 中加入：
```javascript
import DataViewer from '@/components/DataViewer/index.vue'

const selectedNode = ref(null)

// 修改 handleNodeExpand 为 handleNodeClick，除了展开，还要选中节点
async function handleNodeClick(data) {
  if (!data || data.disabled || data.nodeType === 'placeholder') return
  
  // 记录选中节点
  selectedNode.value = {
    nodeType: data.nodeType,
    code: data.code,
    name: data.name || data.label,
    parentCode: data.nodeType === 'point' ? getDeviceCodeFromTree(data) : ''
  }

  // 原有的展开加载逻辑保留...
  // (略)
}

function getDeviceCodeFromTree(pointData) {
  // 简单遍历或根据 parentId 查找，如果数据里有可以直接拿
  // 由于 treeData 构造时可以传入，最简单是修改 listPoint 映射时把 deviceCode 带上
  return pointData.deviceCode || ''
}

// 在顶部的 el-tree-v2 增加 @node-click="handleNodeClick"
```

- [ ] **Step 2: 修改右侧面板渲染逻辑**

在 `OverviewTab.vue` 的 `<el-col :span="16" class="right-col">` 内部，使用 `v-if` 包裹原有的统计图表，并加入 `DataViewer`：

```html
      <!-- 右侧：统计与图表 -->
      <el-col :span="16" class="right-col">
        <!-- 未选中具体节点时显示全局统计 -->
        <div v-if="!selectedNode || selectedNode.nodeType === 'station'" class="global-dashboard">
           <!-- 原来的 el-row 统计卡片和图表全放在这里 -->
           ...
        </div>

        <!-- 选中设备或测点时显示具体数据视图 -->
        <div v-else class="detail-dashboard" style="height: 100%;">
           <el-card class="box-card" shadow="never" style="height: 100%;">
             <template #header>
               <div class="card-header">
                 <div class="header-title">
                   <div class="title-accent"></div>
                   <span>{{ selectedNode.name }} 数据视图</span>
                 </div>
                 <el-button link @click="selectedNode = null">返回总览</el-button>
               </div>
             </template>
             <DataViewer 
               :viewType="selectedNode.nodeType" 
               :code="selectedNode.code" 
               :parentCode="selectedNode.parentCode"
               :name="selectedNode.name" 
             />
           </el-card>
        </div>
      </el-col>
```

- [ ] **Step 3: 优化 treeData 构造**

确保在 `loadStations`、`handleNodeExpand` 中，映射 `deviceCode` 等字段。
```javascript
      data.children = list.map(p => ({
        ...p,
        id: `p_${p.id}`,
        label: p.name,
        nodeType: 'point',
        deviceCode: p.deviceCode, // 确保有这个字段
        children: []
      }))
```

- [ ] **Step 4: Commit**

```bash
git add admin/src/views/water-basic/station-device-point/components/OverviewTab.vue
git commit -m "feat: [前端] 物联拓扑总览支持点击树节点联动展示设备与测点实时/历史数据"
```
