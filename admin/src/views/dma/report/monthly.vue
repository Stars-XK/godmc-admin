<template>
  <div class="app-container dma-report-page">
    <div class="query-bar">
      <div class="query-bar-left">
        <el-date-picker
          v-model="queryParams.date" type="month" placeholder="选择月份"
          format="YYYY-MM" value-format="YYYY-MM" :clearable="false"
          @change="handleQuery"
        />
        <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        <el-button type="success" icon="DataLine" :loading="triggering" @click="handleTriggerAgg">触发重新计算</el-button>
      </div>
    </div>

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

    <el-row :gutter="16" class="content-row">
      <el-col :span="12" class="content-col">
        <div class="section-card">
          <div class="section-header">
            <span class="section-title">分区层级</span>
            <span class="section-date">{{ queryParams.date }}</span>
          </div>
          <div class="tree-table-wrapper">
            <el-table
              v-loading="loading"
              :data="reportList"
              row-key="id"
              :default-expanded-keys="defaultExpandedKeys"
              :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
              highlight-current-row
              @row-click="handleRowClick"
              height="100%"
              size="small"
            >
              <el-table-column prop="name" label="分区名称" min-width="160" fixed="left">
                <template #default="scope">
                  <span class="zone-name-cell">
                    <el-icon v-if="scope.row.hasChildren" class="zone-folder-icon"><FolderOpened /></el-icon>
                    <el-icon v-else class="zone-leaf-icon"><MapLocation /></el-icon>
                    {{ scope.row.name }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="code" label="编码" width="120" />
              <el-table-column label="供水量" width="120" align="right">
                <template #default="scope">
                  <span class="col-supply">{{ scope.row.supply || '0.00' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="售水量" width="120" align="right">
                <template #default="scope">
                  <span class="col-sales">{{ scope.row.sales || '0.00' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="产销差" width="120" align="right">
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
        </div>
      </el-col>

      <el-col :span="12" class="content-col">
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
            <el-radio-group v-model="trendMonths" @change="fetchTrend" size="small">
              <el-radio-button :value="6">6月</el-radio-button>
              <el-radio-button :value="12">12月</el-radio-button>
              <el-radio-button :value="24">24月</el-radio-button>
            </el-radio-group>
          </div>

          <div v-loading="trendLoading" class="chart-container" ref="chartRef"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="DmaMonthlyReport">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import * as echarts from 'echarts'

const loading = ref(false)
const triggering = ref(false)
const reportList = ref([])
const selectedZone = ref(null)
const trendLoading = ref(false)
const trendMonths = ref(12)
const defaultExpandedKeys = ref([])
const chartRef = ref(null)
let chartInstance = null

const queryParams = reactive({
  date: new Date().toISOString().substring(0, 7)
})

const rootStats = reactive({ supply: '0.00', sales: '0.00', nrwDiff: '0.00', nrwRatio: '0.00' })

const ratioClass = computed(() => {
  const v = parseFloat(rootStats.nrwRatio)
  if (v <= 10) return 'ratio-ok'
  if (v <= 20) return 'ratio-warn'
  return 'ratio-bad'
})

function getList() {
  loading.value = true
  selectedZone.value = null
  request({
    url: '/report/tree-summary',
    method: 'get',
    params: { date: queryParams.date, type: '1mo' }
  }).then(res => {
    const tree = res.data || []
    reportList.value = tree
    if (tree.length > 0) {
      rootStats.supply = (tree[0].supply || 0).toFixed(2)
      rootStats.sales = (tree[0].sales || 0).toFixed(2)
      rootStats.nrwDiff = (tree[0].nrwDiff || 0).toFixed(2)
      rootStats.nrwRatio = (tree[0].nrwRatio || 0).toFixed(2)
      defaultExpandedKeys.value = tree.map(n => n.id)
      nextTick(() => {
        selectedZone.value = tree[0]
        nextTick(() => fetchTrend())
      })
    }
    loading.value = false
  }).catch(() => { loading.value = false })
}

function handleRowClick(row) {
  selectedZone.value = row
  nextTick(() => fetchTrend())
}

function handleQuery() { getList() }

function resetQuery() {
  queryParams.date = new Date().toISOString().substring(0, 7)
  handleQuery()
}

function handleTriggerAgg() {
  triggering.value = true
  request({
    url: '/report/trigger-agg',
    method: 'get',
    params: { date: queryParams.date, type: '1mo' }
  }).then(() => {
    ElMessage.success('触发月度重新计算成功')
    setTimeout(() => { getList(); triggering.value = false }, 2000)
  }).catch(() => { triggering.value = false })
}

function getNrwRatioTag(ratio) {
  const v = parseFloat(ratio)
  if (v <= 10) return 'success'
  if (v <= 20) return 'warning'
  return 'danger'
}

async function fetchTrend() {
  if (!selectedZone.value) { renderEmptyChart(); return }
  const endMonth = queryParams.date
  const startDate = new Date(endMonth + '-01')
  startDate.setMonth(startDate.getMonth() - trendMonths.value + 1)
  const start = startDate.toISOString().substring(0, 7)

  trendLoading.value = true
  try {
    const res = await request({
      url: '/report/nrw-trend',
      method: 'get',
      params: { zoneCode: selectedZone.value.code, startDate: start, endDate: endMonth, type: '1mo' }
    })
    renderChart(res.data || [])
  } catch (e) {
    console.error(e)
  } finally {
    trendLoading.value = false
  }
}

function renderChart(dataList) {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const dates = dataList.map(d => d.date)
  const supplyData = dataList.map(d => d.supply)
  const salesData = dataList.map(d => d.sales)
  const nrwData = dataList.map(d => d.nrw_diff)
  const ratioData = dataList.map(d => d.nrw_ratio)

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['供水量', '售水量', '产销差', '产销差率'],
      bottom: 0,
      textStyle: { fontSize: 11, color: '#94A3B8' }
    },
    grid: { left: '3%', right: '5%', top: '8%', bottom: '14%', containLabel: true },
    xAxis: {
      type: 'category', data: dates,
      axisLabel: { fontSize: 10, color: '#94A3B8' },
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
  }
  chartInstance.setOption(option, true)
}

function handleResize() {
  if (chartInstance) chartInstance.resize()
}

onMounted(() => {
  getList()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.dma-report-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  overflow: hidden;
}

.query-bar { display: flex; align-items: center; flex-shrink: 0; }
.query-bar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.summary-row { flex-shrink: 0; }
.sum-card {
  background: #F8FAFC;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  padding: 14px 18px;
  text-align: center;
}
.sum-label { font-size: 12px; color: #94A3B8; margin-bottom: 4px; letter-spacing: 0.3px; }
.sum-num { font-size: 26px; font-weight: 700; color: #1E293B; font-variant-numeric: tabular-nums; }
.sum-num small { font-size: 12px; font-weight: 400; color: #94A3B8; margin-left: 2px; }
.sum-supply .sum-num { color: #409EFF; }
.sum-sales .sum-num { color: #67C23A; }
.sum-nrw .sum-num { color: #E6A23C; }
.sum-ratio.ratio-ok .sum-num { color: #67C23A; }
.sum-ratio.ratio-warn .sum-num { color: #E6A23C; }
.sum-ratio.ratio-bad .sum-num { color: #F56C6C; }

.content-row { flex: 1; min-height: 0; margin: 0 !important; }
.content-col { height: 100%; padding: 0 !important; }
.content-col:first-child { padding-right: 8px !important; }
.content-col:last-child { padding-left: 8px !important; }

.section-card {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid #F1F5F9;
  flex-shrink: 0;
  gap: 12px;
}
.section-title { font-size: 14px; font-weight: 600; color: #1E293B; }
.section-subtitle { font-size: 12px; color: #94A3B8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.section-date { font-size: 12px; color: #94A3B8; }

.tree-table-wrapper { flex: 1; min-height: 0; overflow: hidden; }
.tree-table-wrapper :deep(.el-table) { height: 100%; }
.zone-name-cell { display: flex; align-items: center; gap: 6px; font-weight: 500; }
.zone-folder-icon { color: #409EFF; font-size: 15px; flex-shrink: 0; }
.zone-leaf-icon { color: #94A3B8; font-size: 14px; flex-shrink: 0; }
.col-supply { color: #409EFF; font-weight: 600; }
.col-sales { color: #67C23A; font-weight: 600; }
.col-nrw { color: #E6A23C; font-weight: 500; }

.trend-panel { background: #F8FAFC; }

.zone-mini-stats {
  display: flex;
  gap: 0;
  padding: 10px 18px;
  border-bottom: 1px solid #F1F5F9;
  flex-shrink: 0;
}
.zone-stat-item {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.zone-stat-item:not(:last-child) {
  border-right: 1px solid #E2E8F0;
}
.zone-stat-label { font-size: 11px; color: #94A3B8; }
.zone-stat-val { font-size: 13px; font-weight: 600; }

.trend-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  border-bottom: 1px solid #F1F5F9;
  flex-shrink: 0;
}
.toolbar-label { font-size: 11px; color: #94A3B8; font-weight: 500; }

.trend-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-container {
  flex: 1;
  min-height: 0;
  width: 100%;
}
</style>
