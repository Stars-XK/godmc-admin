<template>
  <div class="flow-monitor">
    <div class="overview-bar">
      <div class="ov-item"><span class="ov-label">流量测点</span><span class="ov-value">{{ totalPoints }}</span></div>
      <div class="ov-item"><span class="ov-label">今日总流量</span><span class="ov-value">{{ totalFlow }} <small>m³</small></span></div>
      <div class="ov-item"><span class="ov-label">瞬时流量</span><span class="ov-value">{{ instantFlow }} <small>m³/h</small></span></div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="6">
        <el-card shadow="never" class="f-card">
          <template #header><div class="card-title"><el-icon><Grid /></el-icon><span>测点分类</span></div></template>
          <div v-loading="loading">
            <div v-for="g in groups" :key="g.typeLabel" class="type-group">
              <div class="tg-header">
                <span class="tg-name">{{ g.typeLabel }}</span>
                <el-tag size="small">{{ g.points.length }}</el-tag>
              </div>
              <div v-for="p in g.points" :key="p.code"
                class="point-row" :class="{ active: selectedPoint?.code === p.code }"
                @click="selectPoint(p)">
                <span class="p-name">{{ p.name || p.code }}</span>
                <span class="p-unit">{{ p.unit }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="18">
        <el-card shadow="never" class="f-card" v-if="selectedPoint">
          <template #header>
            <div class="card-title">
              <el-icon><TrendCharts /></el-icon><span>实时流量 — {{ selectedPoint.name || selectedPoint.code }}</span>
              <el-radio-group v-model="trendInterval" size="small" style="margin-left:auto" @change="fetchTrend">
                <el-radio-button value="5m">6h</el-radio-button>
                <el-radio-button value="1h">24h</el-radio-button>
                <el-radio-button value="1d">7d</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="realtime-grid">
            <div class="rt-item"><span class="rt-label">当前值</span><span class="rt-value">{{ currentValStr }}</span><span class="rt-unit">{{ selectedPoint.unit }}</span></div>
            <div class="rt-item"><span class="rt-label">量程</span><span class="rt-value normal">0 ~ {{ selectedPoint.rangeMax }}</span><span class="rt-unit">{{ selectedPoint.unit }}</span></div>
            <div class="rt-item"><span class="rt-label">更新时间</span><span class="rt-value time">{{ lastUpdate || '--' }}</span></div>
            <div class="rt-item"><span class="rt-label">编码</span><span class="rt-value code">{{ selectedPoint.code }}</span></div>
          </div>
          <div ref="trendChartRef" class="chart-box"></div>
        </el-card>
        <el-card shadow="never" class="f-card" v-if="!selectedPoint">
          <div class="empty-state">
            <el-icon :size="48"><Search /></el-icon><p>请从左侧列表选择一个流量测点</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Grid, TrendCharts, Search } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import request from '@/utils/request'
import { getLatestDataBatch } from '@/api/data-integration/query'
import dayjs from 'dayjs'

const loading = ref(false)
const groups = ref([])
const totalPoints = ref(0)
const totalFlow = ref('--')
const instantFlow = ref('--')

const selectedPoint = ref(null)
const currentValue = ref(null)
const lastUpdate = ref(null)
const trendInterval = ref('1h')
const trendChartRef = ref(null)
let trendChart = null

const currentValStr = computed(() => currentValue.value !== null ? currentValue.value.toFixed(2) : '--')

function fetchPoints() {
  loading.value = true
  request({ url: '/water-basic/flow-monitor/points', method: 'get' }).then(res => {
    if (res.data) {
      groups.value = res.data.groups || []
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
    nextTick(() => fetchTrend())
  })
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
      trendChart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'category', data: dates.map(d => dayjs(d).format(trendInterval.value === '1d' ? 'MM-DD' : 'HH:mm')), axisLabel: { fontSize: 10 } },
        yAxis: { type: 'value', name: selectedPoint.value.unit, axisLabel: { fontSize: 10 } },
        series: [{
          type: 'bar', data: vals,
          itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#2563EB' }, { offset: 1, color: '#93C5FD' }]) },
          barWidth: '60%',
        }],
      }, true)
    }).catch(() => {})
}

onMounted(() => { fetchPoints() })
</script>

<style lang="scss" scoped>
.flow-monitor { padding: 20px 24px; }

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

.f-card { border-radius: 10px; border: 1px solid #E2E8F0; box-shadow: none; margin-bottom: 0; height: 100%; }

.card-title {
  display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #0F172A;
  .el-icon { color: #0D9488; }
}

.type-group { margin-bottom: 14px; }
.tg-header { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
.tg-name { font-size: 13px; font-weight: 600; color: #475569; }

.point-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 10px; border-radius: 6px; cursor: pointer; margin: 3px 0;
  border: 1px solid transparent;
  &:hover { background: #EFF6FF; }
  &.active { background: #EFF6FF; border-color: #2563EB; }
}
.p-name { font-size: 13px; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.p-unit { font-size: 11px; color: #94A3B8; margin-left: 8px; flex-shrink: 0; }

.realtime-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
}
.rt-item {
  background: #F8FAFC; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.rt-label { font-size: 12px; color: #94A3B8; }
.rt-value { font-size: 24px; font-weight: 700; color: #2563EB; }
.rt-value.normal { font-size: 16px; color: #0D9488; }
.rt-value.time { font-size: 13px; color: #64748B; }
.rt-value.code { font-size: 13px; color: #475569; font-family: monospace; }
.rt-unit { font-size: 12px; color: #94A3B8; }

.chart-box { width: 100%; height: 300px; margin-top: 16px; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 80px 0; color: #94A3B8; p { margin-top: 12px; } }
</style>
