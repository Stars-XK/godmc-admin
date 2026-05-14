<template>
  <div class="pressure-page">
    <div class="overview-bar">
      <div class="ov-item"><span class="ov-label">压力监测点</span><span class="ov-value">{{ totalPoints }}</span></div>
      <div class="ov-item"><span class="ov-label">平均压力</span><span class="ov-value">{{ avgPressure }} <small>MPa</small></span></div>
      <div class="ov-item"><span class="ov-label">超压报警</span><span class="ov-value bad">{{ overPressureCount }}</span></div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="6">
        <el-card shadow="never" class="p-card">
          <template #header><div class="card-title"><el-icon><Grid /></el-icon><span>监测点列表</span></div></template>
          <el-input v-model="searchKey" placeholder="搜索测点" size="small" clearable style="margin-bottom:12px" />
          <div v-loading="loading" class="point-list">
            <div v-for="p in filteredPoints" :key="p.code"
              class="point-row" :class="{ active: selectedPoint?.code === p.code }"
              @click="selectPoint(p)">
              <div class="p-info">
                <span class="p-name">{{ p.name || p.code }}</span>
                <span class="p-type">{{ p.typeLabel }}</span>
              </div>
              <span class="p-status" :class="getStatus(p.code)"></span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="18">
        <el-card shadow="never" class="p-card" v-if="selectedPoint">
          <template #header>
            <div class="card-title">
              <el-icon><Odometer /></el-icon><span>实时压力 — {{ selectedPoint.name || selectedPoint.code }}</span>
              <el-radio-group v-model="trendInterval" size="small" style="margin-left:auto" @change="fetchTrend">
                <el-radio-button value="5m">6h</el-radio-button>
                <el-radio-button value="1h">24h</el-radio-button>
                <el-radio-button value="1d">7d</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <!-- 压力表盘 -->
          <div class="gauge-row">
            <div ref="gaugeRef" class="gauge-box"></div>
            <div class="gauge-info">
              <div class="gi-item"><span class="gi-label">当前压力</span><span class="gi-value" :style="{ color: pressureColor(currentValue, selectedPoint.rangeMax) }">{{ currentValStr }} <small>MPa</small></span></div>
              <div class="gi-item"><span class="gi-label">量程上限</span><span class="gi-value normal">{{ selectedPoint.rangeMax }} MPa</span></div>
              <div class="gi-item"><span class="gi-label">更新时间</span><span class="gi-value time">{{ lastUpdate || '--' }}</span></div>
              <div class="gi-item"><span class="gi-label">测点编码</span><span class="gi-value code">{{ selectedPoint.code }}</span></div>
            </div>
          </div>
          <!-- 趋势图 -->
          <div ref="trendChartRef" class="chart-box"></div>
        </el-card>

        <el-card shadow="never" class="p-card" v-if="!selectedPoint">
          <div class="empty-state">
            <el-icon :size="48"><Search /></el-icon>
            <p>请从左侧列表选择一个压力监测点</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Grid, Odometer, Search } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import request from '@/utils/request'
import { getLatestDataBatch } from '@/api/data-integration/query'
import dayjs from 'dayjs'

const loading = ref(false)
const points = ref([])
const totalPoints = ref(0)
const avgPressure = ref(0)
const overPressureCount = ref(0)
const searchKey = ref('')

const selectedPoint = ref(null)
const currentValue = ref(null)
const lastUpdate = ref(null)
const trendInterval = ref('1h')

const gaugeRef = ref(null)
const trendChartRef = ref(null)
let gaugeChart = null
let trendChart = null
const statusMap = ref({})

const filteredPoints = computed(() => {
  if (!searchKey.value) return points.value
  const kw = searchKey.value.toLowerCase()
  return points.value.filter(p => (p.name || p.code || '').toLowerCase().includes(kw))
})

const currentValStr = computed(() => currentValue.value !== null ? currentValue.value.toFixed(3) : '--')

function pressureColor(val, max) {
  if (val === null) return '#94A3B8'
  if (val > max) return '#EF4444'
  if (val > max * 0.9) return '#F59E0B'
  return '#10B981'
}

function getStatus(code) { return statusMap.value[code] || 'unknown' }

function fetchPoints() {
  loading.value = true
  request({ url: '/water-basic/pressure/points', method: 'get' }).then(res => {
    if (res.data) {
      points.value = res.data.points || []
      totalPoints.value = res.data.total || 0
    }
  }).finally(() => { loading.value = false })
}

function selectPoint(p) {
  selectedPoint.value = p
  currentValue.value = null
  lastUpdate.value = null
  getLatestDataBatch({ pointCodes: p.code }).then(res => {
    if (res.data?.[p.code]) {
      const d = res.data[p.code]
      currentValue.value = Number(d.value || d.val || 0)
      lastUpdate.value = d.ts ? dayjs(d.ts).format('MM-DD HH:mm:ss') : dayjs().format('MM-DD HH:mm:ss')
    }
    nextTick(() => { renderGauge(); fetchTrend() })
  })
}

function renderGauge() {
  if (!gaugeRef.value || !selectedPoint.value) return
  if (!gaugeChart) gaugeChart = echarts.init(gaugeRef.value)
  const max = selectedPoint.value.rangeMax || 1.6
  const val = currentValue.value || 0
  gaugeChart.setOption({
    series: [{
      type: 'gauge', radius: '90%', center: ['50%', '55%'],
      startAngle: 210, endAngle: -30,
      min: 0, max: max,
      axisLine: { lineStyle: { width: 16, color: [[0.6, '#10B981'], [0.9, '#F59E0B'], [1, '#EF4444']] } },
      pointer: { length: '60%', width: 6, itemStyle: { color: '#0D9488' } },
      axisTick: { distance: -16, length: 6 },
      splitLine: { distance: -20, length: 14 },
      axisLabel: { distance: 30, fontSize: 10 },
      detail: { valueAnimation: true, fontSize: 16, offsetCenter: [0, '70%'], formatter: '{value} MPa' },
      data: [{ value: val, name: selectedPoint.value.name || selectedPoint.value.code }],
    }],
  }, true)
}

const timeRanges = { '5m': [6, 'hour'], '1h': [24, 'hour'], '1d': [7, 'day'] }

function fetchTrend() {
  if (!selectedPoint.value || !trendChartRef.value) return
  const [n, unit] = timeRanges[trendInterval.value] || [24, 'hour']
  const end = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const start = dayjs().subtract(n, unit).format('YYYY-MM-DD HH:mm:ss')
  request({ url: '/data-integration/query/history', method: 'get', params: { pointCode: selectedPoint.value.code, startDate: start, endDate: end, interval: trendInterval.value } })
    .then(res => {
      const data = res.data?.data || res.data || []
      const dates = data.map(d => d.ts || d[0])
      const vals = data.map(d => d.val ?? d[1] ?? 0)
      if (!trendChart) trendChart = echarts.init(trendChartRef.value)
      const max = selectedPoint.value.rangeMax || 1.6
      trendChart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: dates.map(d => dayjs(d).format(trendInterval.value === '1d' ? 'MM-DD' : 'HH:mm')), axisLabel: { fontSize: 10 } },
        yAxis: { type: 'value', name: 'MPa', axisLabel: { fontSize: 10 } },
        series: [{
          type: 'line', data: vals, smooth: true, symbol: 'none',
          lineStyle: { width: 2, color: '#2563EB' },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(37,99,235,0.15)' }, { offset: 1, color: 'rgba(37,99,235,0.02)' }]) },
          markLine: { silent: true, symbol: 'none', lineStyle: { type: 'dashed', color: '#EF4444' }, data: [{ yAxis: max, label: { formatter: `上限${max}`, fontSize: 10 } }] },
        }],
      }, true)
    }).catch(() => {})
}

onMounted(() => { fetchPoints() })
</script>

<style lang="scss" scoped>
.pressure-page { padding: 20px 24px; }

.overview-bar {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;
}
.ov-item {
  background: #FFF; border-radius: 10px; padding: 16px 20px; border: 1px solid #E2E8F0;
  display: flex; justify-content: space-between; align-items: center;
}
.ov-label { font-size: 13px; color: #64748B; }
.ov-value { font-size: 28px; font-weight: 700; color: #0F172A; }
.ov-value small { font-size: 14px; font-weight: 400; color: #94A3B8; }
.ov-value.bad { color: #EF4444; }

.p-card { border-radius: 10px; border: 1px solid #E2E8F0; box-shadow: none; margin-bottom: 0; height: 100%; }

.card-title {
  display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #0F172A;
  .el-icon { color: #0D9488; }
}

.point-list { max-height: calc(100vh - 300px); overflow-y: auto; }
.point-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 10px; border-radius: 6px; cursor: pointer; margin: 3px 0;
  border: 1px solid transparent;
  &:hover { background: #F0FDFA; }
  &.active { background: #F0FDFA; border-color: #0D9488; }
}
.p-info { display: flex; flex-direction: column; min-width: 0; }
.p-name { font-size: 13px; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.p-type { font-size: 11px; color: #94A3B8; }
.p-status { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.p-status.ok { background: #10B981; }
.p-status.warn { background: #F59E0B; }
.p-status.bad { background: #EF4444; }
.p-status.unknown { background: #CBD5E1; }

// Gauge
.gauge-row { display: flex; gap: 24px; align-items: center; }
.gauge-box { width: 200px; height: 200px; flex-shrink: 0; }
.gauge-info { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.gi-item { background: #F8FAFC; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 4px; }
.gi-label { font-size: 12px; color: #94A3B8; }
.gi-value { font-size: 20px; font-weight: 700; }
.gi-value.normal { font-size: 16px; color: #0D9488; }
.gi-value.time { font-size: 13px; color: #64748B; }
.gi-value.code { font-size: 13px; color: #475569; font-family: monospace; }
.gi-value small { font-size: 12px; font-weight: 400; color: #94A3B8; }

.chart-box { width: 100%; height: 260px; margin-top: 16px; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 80px 0; color: #94A3B8; p { margin-top: 12px; } }

@media (max-width: 992px) {
  .gauge-row { flex-direction: column; }
}
</style>
