<template>
  <div class="app-container dma-report-page">
    <!-- 顶部查询栏 -->
    <div class="query-bar">
      <div class="query-bar-left">
        <el-date-picker
          v-model="queryParams.date" type="date" placeholder="选择日期"
          format="YYYY-MM-DD" value-format="YYYY-MM-DD" :clearable="false"
          @change="handleQuery"
        />
        <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        <el-button type="success" icon="DataLine" :loading="triggering" @click="handleTriggerAgg">触发重新计算</el-button>
      </div>
    </div>

    <!-- 汇总统计卡片 -->
    <el-row :gutter="16" class="summary-row">
      <el-col :span="6">
        <div class="sum-card sum-supply">
          <div class="sum-label">总供水量</div>
          <div class="sum-num">{{ rootStats.supply }} <small>m³</small></div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="sum-card sum-sales">
          <div class="sum-label">总售水量</div>
          <div class="sum-num">{{ rootStats.sales }} <small>m³</small></div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="sum-card sum-nrw">
          <div class="sum-label">产销差水量</div>
          <div class="sum-num">{{ rootStats.nrwDiff }} <small>m³</small></div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="sum-card sum-ratio" :class="ratioClass">
          <div class="sum-label">产销差率</div>
          <div class="sum-num">{{ rootStats.nrwRatio }}<small>%</small></div>
        </div>
      </el-col>
    </el-row>

    <!-- 双栏: 树形表格 + 趋势图/地图 -->
    <el-row :gutter="16" class="content-row">
      <!-- 左侧: 树形表格 (同分区管理) -->
      <el-col :span="12" class="content-col">
        <div class="section-card">
          <div class="section-header">
            <span class="section-title">分区层级</span>
            <span class="section-date">{{ queryParams.date }}</span>
          </div>
          <el-table
            v-if="refreshTable"
            v-loading="loading"
            :data="reportList"
            row-key="id"
            :expand-row-keys="expandedRowKeys"
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            lazy
            :load="handleLoadNode"
            highlight-current-row
            @row-click="handleRowClick"
            @expand-change="handleExpandChange"
            size="small"
            class="flex-table"
          >
            <el-table-column prop="name" label="分区名称" min-width="160" show-overflow-tooltip>
              <template #default="scope">
                <span class="zone-name-cell">
                  <el-icon v-if="scope.row.hasChildren" class="zone-folder-icon"><FolderOpened /></el-icon>
                  <el-icon v-else class="zone-leaf-icon"><MapLocation /></el-icon>
                  {{ scope.row.name }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="code" label="编码" width="120" />
            <el-table-column label="供水量" width="110" align="right">
              <template #default="scope">
                <span class="col-supply">{{ scope.row.supply || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="售水量" width="110" align="right">
              <template #default="scope">
                <span class="col-sales">{{ scope.row.sales || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="产销差" width="110" align="right">
              <template #default="scope">
                <span class="col-nrw">{{ scope.row.nrwDiff || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="差率" width="80" align="center">
              <template #default="scope">
                <el-tag :type="getNrwRatioTag(scope.row.nrwRatio)" size="small" effect="plain">
                  {{ scope.row.nrwRatio || '0.00' }}%
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>

      <!-- 右侧: 趋势图 + 地图 -->
      <el-col :span="12" class="content-col right-col">
        <div class="section-card trend-panel">
          <div class="section-header">
            <span class="section-title">历史趋势</span>
            <span class="section-subtitle">{{ selectedZone ? selectedZone.name : '点击左侧分区查看' }}</span>
          </div>

          <div class="zone-mini-stats">
            <div class="zone-stat-item">
              <span class="zone-stat-label">供水量</span>
              <span class="zone-stat-val col-supply">{{ selectedZone ? (selectedZone.supply || '0.00') : '—' }} m³</span>
            </div>
            <div class="zone-stat-item">
              <span class="zone-stat-label">售水量</span>
              <span class="zone-stat-val col-sales">{{ selectedZone ? (selectedZone.sales || '0.00') : '—' }} m³</span>
            </div>
            <div class="zone-stat-item">
              <span class="zone-stat-label">产销差</span>
              <span class="zone-stat-val col-nrw">{{ selectedZone ? (selectedZone.nrwDiff || '0.00') : '—' }} m³</span>
            </div>
            <div class="zone-stat-item">
              <span class="zone-stat-label">产销差率</span>
              <el-tag v-if="selectedZone" :type="getNrwRatioTag(selectedZone.nrwRatio)" size="small" effect="plain">
                {{ selectedZone.nrwRatio || '0.00' }}%
              </el-tag>
              <span v-else class="zone-stat-val" style="color:#94A3B8">—</span>
            </div>
          </div>

          <div class="trend-toolbar">
            <span class="toolbar-label">范围</span>
            <el-radio-group v-model="trendDays" @change="(val) => fetchTrend(val)" size="small">
              <el-radio-button :value="7">7天</el-radio-button>
              <el-radio-button :value="14">14天</el-radio-button>
              <el-radio-button :value="30">30天</el-radio-button>
            </el-radio-group>
          </div>

          <div v-loading="trendLoading" class="chart-container" ref="chartRef"></div>
        </div>

        <!-- 地图 -->
        <div class="section-card map-panel">
          <div class="section-header">
            <span class="section-title">分区位置</span>
            <span v-if="selectedZone" class="section-subtitle">{{ selectedZone.name }}</span>
            <span v-else class="section-subtitle">选择分区后定位</span>
          </div>
          <div class="mini-map-container" ref="mapContainer">
            <div v-if="!mapInstance" class="map-placeholder">
              <div class="map-content">
                <el-icon style="font-size:36px;color:#909399;"><MapLocation /></el-icon>
                <p>{{ amapKey ? '定位中...' : '未配置地图Key' }}</p>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="DmaDailyReport">
import { ref, shallowRef, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, DataLine, MapLocation, FolderOpened } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { listZoneTree, lazyZoneChildren } from '@/api/water-basic/zone'
import { getConfigKey } from '@/api/system/config'
import * as echarts from 'echarts'
import AMapLoader from '@amap/amap-jsapi-loader'

const loading = ref(false)
const triggering = ref(false)
const reportList = ref([])
const selectedZone = ref(null)
const trendLoading = ref(false)
const trendDays = ref(7)
const refreshTable = ref(true)
const expandedRowKeys = ref([])
const userExpandedKeys = ref(new Set())
const chartRef = ref(null)
let chartInstance = null

// 地图
const mapContainer = ref(null)
const amapKey = ref('')
const amapSecurity = ref('')
const amapStyle = ref('amap://styles/light')
const mapInstance = shallowRef(null)
const mapReady = ref(false)
let markers = []

const queryParams = reactive({
  date: new Date(Date.now() - 86400000).toISOString().split('T')[0]
})

const rootStats = reactive({ supply: '0.00', sales: '0.00', nrwDiff: '0.00', nrwRatio: '0.00' })

const ratioClass = computed(() => {
  const v = parseFloat(rootStats.nrwRatio)
  if (v <= 10) return 'ratio-ok'
  if (v <= 20) return 'ratio-warn'
  return 'ratio-bad'
})

// 递归清理后端树数据的 hasChildren，与分区管理一致
function cleanHasChildren(list) {
  if (!list || !list.length) return []
  return list.map(item => {
    if (item.children && item.children.length > 0) {
      delete item.hasChildren
      item.children = cleanHasChildren(item.children)
    } else {
      if (item.hasChildren) {
        delete item.children
      } else {
        item.children = undefined
      }
    }
    return item
  })
}

function getExpandedKeys(data, maxLevel, currentLevel = 1) {
  let keys = []
  if (currentLevel > maxLevel) return keys
  data.forEach(item => {
    keys.push(item.id)
    if (item.children && item.children.length > 0) {
      keys = keys.concat(getExpandedKeys(item.children, maxLevel, currentLevel + 1))
    }
  })
  return keys
}

function collectZoneCodes(nodes, maxLevel, depth = 1) {
  const codes = []
  for (const node of nodes) {
    if (node.code && depth <= maxLevel) codes.push(node.code)
    if (node.children && node.children.length > 0 && depth < maxLevel) {
      codes.push(...collectZoneCodes(node.children, maxLevel, depth + 1))
    }
  }
  return codes
}

async function loadNrwForZones(zoneCodes) {
  if (!zoneCodes || zoneCodes.length === 0) return {}
  try {
    const res = await request({
      url: '/report/nrw-batch',
      method: 'get',
      params: { zoneCodes: zoneCodes.join(','), date: queryParams.date, type: '1d' }
    })
    return res.data || {}
  } catch (e) { return {} }
}

function mergeNrwToTree(nodes, nrwMap) {
  for (const node of nodes) {
    const nrw = nrwMap[node.code]
    if (nrw) {
      node.supply = nrw.supply; node.sales = nrw.sales
      node.nrwDiff = nrw.nrwDiff; node.nrwRatio = nrw.nrwRatio
    } else {
      node.supply = 0; node.sales = 0; node.nrwDiff = 0; node.nrwRatio = 0
    }
    if (node.children && node.children.length > 0) mergeNrwToTree(node.children, nrwMap)
  }
}

function getList() {
  loading.value = true
  selectedZone.value = null
  listZoneTree({}).then(async (response) => {
    refreshTable.value = false
    const rawData = response.data || response
    const cleanData = cleanHasChildren(rawData)
    reportList.value = cleanData

    if (userExpandedKeys.value.size === 0) {
      const defaultKeys = getExpandedKeys(cleanData, 2)
      defaultKeys.forEach(key => userExpandedKeys.value.add(key))
    }
    expandedRowKeys.value = Array.from(userExpandedKeys.value)

    const visibleCodes = collectZoneCodes(cleanData, 2)
    if (visibleCodes.length > 0) {
      const nrwMap = await loadNrwForZones(visibleCodes)
      mergeNrwToTree(cleanData, nrwMap)
      if (cleanData.length > 0) {
        rootStats.supply = (cleanData[0].supply || 0).toFixed(2)
        rootStats.sales = (cleanData[0].sales || 0).toFixed(2)
        rootStats.nrwDiff = (cleanData[0].nrwDiff || 0).toFixed(2)
        rootStats.nrwRatio = (cleanData[0].nrwRatio || 0).toFixed(2)
      }
    }

    loading.value = false
    nextTick(() => { refreshTable.value = true })

    const firstLeaf = findFirstLeaf(cleanData)
    if (firstLeaf) {
      selectedZone.value = firstLeaf
      nextTick(() => { fetchTrend(); locateZoneOnMap(firstLeaf) })
    } else {
      nextTick(() => renderEmptyChart())
    }
  }).catch(() => { loading.value = false })
}

function findFirstLeaf(nodes) {
  for (const node of nodes) {
    if (!node.hasChildren || !node.children || node.children.length === 0) return node
    const leaf = findFirstLeaf(node.children)
    if (leaf) return leaf
  }
  return nodes[0] || null
}

async function handleLoadNode(row, treeNode, resolve) {
  try {
    const res = await lazyZoneChildren(row.code, {})
    const children = cleanHasChildren(res.data || [])
    const codes = children.filter(c => c.code).map(c => c.code)
    if (codes.length > 0) {
      const nrwMap = await loadNrwForZones(codes)
      mergeNrwToTree(children, nrwMap)
    }
    resolve(children)
  } catch (e) { resolve([]) }
}

function handleExpandChange(row, expanded) {
  if (expanded) {
    userExpandedKeys.value.add(row.id)
  } else {
    userExpandedKeys.value.delete(row.id)
  }
}

function handleRowClick(row) {
  selectedZone.value = row
  nextTick(() => {
    fetchTrend()
    locateZoneOnMap(row)
  })
}

function handleQuery() {
  userExpandedKeys.value.clear()
  getList()
}

function resetQuery() {
  queryParams.date = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  handleQuery()
}

function handleTriggerAgg() {
  triggering.value = true
  request({
    url: '/report/trigger-agg',
    method: 'get',
    params: { date: queryParams.date, type: '1d' }
  }).then(() => {
    ElMessage.success('触发重新计算成功')
    setTimeout(() => { getList(); triggering.value = false }, 2000)
  }).catch(() => { triggering.value = false })
}

function getNrwRatioTag(ratio) {
  const v = parseFloat(ratio)
  if (v <= 10) return 'success'
  if (v <= 20) return 'warning'
  return 'danger'
}

let trendSeq = 0

async function fetchTrend(days) {
  if (!selectedZone.value) { renderEmptyChart(); return }
  const range = days || trendDays.value
  const end = queryParams.date
  const startDate = new Date(end)
  startDate.setDate(startDate.getDate() - range + 1)
  const start = startDate.toISOString().split('T')[0]

  const seq = ++trendSeq
  trendLoading.value = true
  try {
    const res = await request({
      url: '/report/nrw-trend',
      method: 'get',
      params: { zoneCode: selectedZone.value.code, startDate: start, endDate: end, type: '1d' }
    })
    if (seq !== trendSeq) return
    renderChart(res.data || [], range)
  } catch (e) {
    if (seq !== trendSeq) return
    console.error(e)
    renderEmptyChart(range)
  } finally {
    if (seq === trendSeq) trendLoading.value = false
  }
}

function buildDateLabels(days) {
  const labels = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(queryParams.date)
    d.setDate(d.getDate() - i)
    labels.push(d.toISOString().split('T')[0])
  }
  return labels
}

function renderChart(dataList, range) {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  const actualRange = range || trendDays.value

  const hasData = dataList && dataList.length > 0
  const dates = hasData ? dataList.map(d => d.date) : buildDateLabels(actualRange)
  const supplyData = hasData ? dataList.map(d => d.supply) : []
  const salesData = hasData ? dataList.map(d => d.sales) : []
  const nrwData = hasData ? dataList.map(d => d.nrw_diff) : []
  const ratioData = hasData ? dataList.map(d => d.nrw_ratio) : []

  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['供水量', '售水量', '产销差', '产销差率'],
      bottom: 0,
      textStyle: { fontSize: 11, color: '#94A3B8' }
    },
    grid: { left: '3%', right: '5%', top: '8%', bottom: '14%', containLabel: true },
    xAxis: {
      type: 'category', data: dates,
      axisLabel: { fontSize: 10, rotate: 30, color: '#94A3B8' },
      axisLine: { lineStyle: { color: '#E2E8F0' } }
    },
    yAxis: [
      {
        type: 'value', name: '水量(m³)',
        nameTextStyle: { fontSize: 10, color: '#94A3B8' },
        splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } },
        axisLabel: { fontSize: 10, color: '#94A3B8' }
      },
      {
        type: 'value', name: '比率(%)',
        nameTextStyle: { fontSize: 10, color: '#94A3B8' },
        splitLine: { show: false },
        axisLabel: { fontSize: 10, color: '#94A3B8' }
      }
    ],
    series: [
      { name: '供水量', type: 'bar', data: supplyData, itemStyle: { color: '#409EFF', borderRadius: [3,3,0,0] }, barWidth: '30%' },
      { name: '售水量', type: 'bar', data: salesData, itemStyle: { color: '#67C23A', borderRadius: [3,3,0,0] }, barWidth: '30%' },
      { name: '产销差', type: 'bar', data: nrwData, itemStyle: { color: '#E6A23C', borderRadius: [3,3,0,0] }, barWidth: '30%' },
      { name: '产销差率', type: 'line', yAxisIndex: 1, data: ratioData, itemStyle: { color: '#F56C6C' }, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2 } }
    ]
  }, true)
}

function renderEmptyChart(range) {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  const dates = buildDateLabels(range || trendDays.value)
  chartInstance.setOption({
    xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10, rotate: 30, color: '#94A3B8' }, axisLine: { lineStyle: { color: '#E2E8F0' } } },
    yAxis: [
      { type: 'value', name: '水量(m³)', nameTextStyle: { fontSize: 10, color: '#94A3B8' }, splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } }, axisLabel: { fontSize: 10, color: '#94A3B8' } },
      { type: 'value', name: '比率(%)', nameTextStyle: { fontSize: 10, color: '#94A3B8' }, splitLine: { show: false }, axisLabel: { fontSize: 10, color: '#94A3B8' } }
    ],
    grid: { left: '3%', right: '5%', top: '8%', bottom: '14%', containLabel: true },
    series: []
  }, true)
}

// ==== 地图 ====
async function initMapKey() {
  try {
    const results = await Promise.all([
      getConfigKey('gis.map.amap.key'),
      getConfigKey('gis.map.amap.security'),
      getConfigKey('gis.map.style')
    ])
    if (results[0] && results[0].data) {
      amapKey.value = results[0].data
      amapSecurity.value = (results[1] && results[1].data) || ''
      amapStyle.value = (results[2] && results[2].data) || 'amap://styles/light'
      initAMap()
    }
  } catch (e) { console.error('获取地图Key失败', e) }
}

function initAMap() {
  if (!amapKey.value || !mapContainer.value) return
  if (amapSecurity.value) {
    window._AMapSecurityConfig = { securityJsCode: amapSecurity.value }
  }
  AMapLoader.load({ key: amapKey.value, version: '2.0', plugins: ['AMap.Marker'] })
    .then((AMap) => {
      mapInstance.value = new AMap.Map(mapContainer.value, {
        viewMode: '2D', zoom: 12, center: [118.6, 24.9],
        mapStyle: amapStyle.value
      })
      mapReady.value = true
      if (selectedZone.value) locateZoneOnMap(selectedZone.value)
    })
    .catch(e => { console.error('高德地图加载失败', e) })
}

function locateZoneOnMap(zone) {
  if (!mapInstance.value || !zone) return
  const AMap = window.AMap
  if (!AMap) return

  markers.forEach(m => mapInstance.value.remove(m))
  markers = []

  const lng = zone.longitude ? parseFloat(zone.longitude) : (118.6 + (Math.random() - 0.5) * 0.1)
  const lat = zone.latitude ? parseFloat(zone.latitude) : (24.9 + (Math.random() - 0.5) * 0.1)

  const marker = new AMap.Marker({ position: [lng, lat], title: zone.name || zone.code })
  mapInstance.value.add(marker)
  markers.push(marker)
  mapInstance.value.setZoomAndCenter(14, [lng, lat], false, 1000)
}

function handleResize() {
  if (chartInstance) chartInstance.resize()
}

onMounted(() => {
  getList()
  initMapKey()
  window.addEventListener('resize', handleResize)
  setTimeout(() => renderEmptyChart(), 200)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) chartInstance.dispose()
  if (mapInstance.value) mapInstance.value.destroy()
})
</script>

<style>
/* ===== DMA 日报 — 全局样式(非 scoped，确保暗色模式可覆盖) ===== */
.dma-report-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: calc(100vh - 84px);
  overflow: hidden;
}

.dma-report-page .query-bar { display: flex; align-items: center; flex-shrink: 0; }
.dma-report-page .query-bar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

/* 汇总卡片 */
.dma-report-page .summary-row { flex-shrink: 0; }
.dma-report-page .sum-card {
  background: #F8FAFC;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  padding: 14px 18px;
  text-align: center;
}
.dma-report-page .sum-label { font-size: 12px; color: #94A3B8; margin-bottom: 4px; letter-spacing: 0.3px; }
.dma-report-page .sum-num { font-size: 26px; font-weight: 700; color: #1E293B; font-variant-numeric: tabular-nums; }
.dma-report-page .sum-num small { font-size: 12px; font-weight: 400; color: #94A3B8; margin-left: 2px; }
.dma-report-page .sum-supply .sum-num { color: #409EFF; }
.dma-report-page .sum-sales .sum-num { color: #67C23A; }
.dma-report-page .sum-nrw .sum-num { color: #E6A23C; }
.dma-report-page .sum-ratio.ratio-ok .sum-num { color: #67C23A; }
.dma-report-page .sum-ratio.ratio-warn .sum-num { color: #E6A23C; }
.dma-report-page .sum-ratio.ratio-bad .sum-num { color: #F56C6C; }

/* 内容双栏 */
.dma-report-page .content-row { flex: 1; min-height: 0; margin: 0 !important; overflow: hidden; }
.dma-report-page .content-col { padding: 0 !important; display: flex; flex-direction: column; gap: 12px; overflow: hidden; min-height: 0; }
.dma-report-page .content-col:first-child .section-card { flex: 1; min-height: 0; overflow: hidden; }
.dma-report-page .content-col:first-child { padding-right: 8px !important; }
.dma-report-page .content-col.right-col { padding-left: 8px !important; }

.dma-report-page .section-card {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.dma-report-page .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid #F1F5F9;
  flex-shrink: 0;
  gap: 12px;
}
.dma-report-page .section-title { font-size: 14px; font-weight: 600; color: #1E293B; }
.dma-report-page .section-subtitle { font-size: 12px; color: #94A3B8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.dma-report-page .section-date { font-size: 12px; color: #94A3B8; }

/* 左侧树形表格 — 与分区管理完全一致的 flex 布局 */
.dma-report-page .flex-table {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.dma-report-page .flex-table .el-table__inner-wrapper {
  height: 100% !important;
}
.dma-report-page .zone-name-cell { display: flex; align-items: center; gap: 6px; font-weight: 500; }
.dma-report-page .zone-folder-icon { color: #409EFF; font-size: 15px; flex-shrink: 0; }
.dma-report-page .zone-leaf-icon { color: #94A3B8; font-size: 14px; flex-shrink: 0; }
.dma-report-page .col-supply { color: #409EFF; font-weight: 600; }
.dma-report-page .col-sales { color: #67C23A; font-weight: 600; }
.dma-report-page .col-nrw { color: #E6A23C; font-weight: 500; }

/* 右侧趋势面板 */
.dma-report-page .trend-panel {
  flex: 1;
  min-height: 180px;
  background: #F8FAFC;
}
.dma-report-page .zone-mini-stats {
  display: flex;
  gap: 0;
  padding: 10px 18px;
  border-bottom: 1px solid #F1F5F9;
  flex-shrink: 0;
}
.dma-report-page .zone-stat-item {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dma-report-page .zone-stat-item:not(:last-child) { border-right: 1px solid #E2E8F0; }
.dma-report-page .zone-stat-label { font-size: 11px; color: #94A3B8; }
.dma-report-page .zone-stat-val { font-size: 13px; font-weight: 600; }

.dma-report-page .trend-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  border-bottom: 1px solid #F1F5F9;
  flex-shrink: 0;
}
.dma-report-page .toolbar-label { font-size: 11px; color: #94A3B8; font-weight: 500; }

.dma-report-page .chart-container {
  flex: 1;
  min-height: 150px;
  width: 100%;
}

/* 地图面板 */
.dma-report-page .map-panel {
  flex: 2;
  min-height: 200px;
  overflow: hidden;
}
.dma-report-page .mini-map-container {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
.dma-report-page .map-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #f5f7fa 0%, #e4e7ed 100%);
  z-index: 10;
}
.dma-report-page .map-placeholder .map-content {
  text-align: center;
  color: #606266;
  padding: 36px;
  background: rgba(255,255,255,0.8);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
</style>
