<template>
  <div class="water-quality">
    <!-- 顶部总览 -->
    <div class="overview-bar">
      <div class="ov-item"><span class="ov-label">监测点总数</span><span class="ov-value">{{ totalPoints }}</span></div>
      <div class="ov-item"><span class="ov-label">在线率</span><span class="ov-value" :class="onlineRate >= 80 ? 'good' : onlineRate >= 50 ? 'warn' : 'bad'">{{ onlineRate }}%</span></div>
      <div class="ov-item"><span class="ov-label">今日报警</span><span class="ov-value bad">{{ alarmCount }}</span></div>
    </div>

    <el-row :gutter="20">
      <!-- 左侧：测点分类列表 -->
      <el-col :xs="24" :lg="7">
        <el-card shadow="never" class="wq-card">
          <template #header><div class="card-title"><el-icon><Grid /></el-icon><span>监测分类</span></div></template>
          <div v-loading="loading">
            <div v-for="g in groups" :key="g.category" class="category-group">
              <div class="cat-header">
                <span class="cat-name">{{ g.category }}</span>
                <el-tag size="small">{{ g.points.length }}个测点</el-tag>
              </div>
              <div v-for="p in g.points" :key="p.code"
                class="point-item" :class="{ active: selectedPoint?.code === p.code }"
                @click="selectPoint(p)">
                <span class="point-label">{{ p.name || p.code }}</span>
                <span class="point-type-tag">{{ p.typeLabel }}</span>
              </div>
            </div>
            <div v-if="groups.length === 0 && !loading" class="empty-hint">暂未配置水质监测点</div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：详情 + 趋势 -->
      <el-col :xs="24" :lg="17">
        <!-- 实时值 -->
        <el-card shadow="never" class="wq-card" v-if="selectedPoint">
          <template #header><div class="card-title"><el-icon><TrendCharts /></el-icon><span>实时监测 — {{ selectedPoint.name || selectedPoint.code }}</span></div></template>
          <div class="realtime-grid">
            <div class="rt-item">
              <span class="rt-label">当前值</span>
              <span class="rt-value" :style="{ color: qualityColor(currentValue, selectedPoint.rangeMin, selectedPoint.rangeMax) }">
                {{ currentValue !== null ? currentValue.toFixed(2) : '--' }}
              </span>
              <span class="rt-unit">{{ selectedPoint.unit }}</span>
            </div>
            <div class="rt-item">
              <span class="rt-label">标准范围</span>
              <span class="rt-value normal">{{ selectedPoint.rangeMin }} ~ {{ selectedPoint.rangeMax }}</span>
              <span class="rt-unit">{{ selectedPoint.unit }}</span>
            </div>
            <div class="rt-item">
              <span class="rt-label">测点编码</span>
              <span class="rt-value code">{{ selectedPoint.code }}</span>
            </div>
            <div class="rt-item">
              <span class="rt-label">更新时间</span>
              <span class="rt-value time">{{ lastUpdate || '--' }}</span>
            </div>
          </div>
        </el-card>

        <!-- 趋势图 -->
        <el-card shadow="never" class="wq-card" v-if="selectedPoint" style="margin-top:16px">
          <template #header>
            <div class="card-title">
              <el-icon><TrendCharts /></el-icon><span>历史趋势</span>
              <el-radio-group v-model="trendInterval" size="small" style="margin-left:12px" @change="fetchTrend">
                <el-radio-button value="5m">6小时</el-radio-button>
                <el-radio-button value="1h">24小时</el-radio-button>
                <el-radio-button value="1d">7天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-box"></div>
        </el-card>

        <!-- 未选择 -->
        <el-card shadow="never" class="wq-card" v-if="!selectedPoint">
          <div class="empty-state">
            <el-icon :size="48"><Search /></el-icon>
            <p>请从左侧选择一个监测点查看实时数据与趋势</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { Grid, TrendCharts, Search } from '@element-plus/icons-vue'
import { listQualityPoints, getQualityTrend } from '@/api/water-basic/water-quality'
import { getLatestDataBatch } from '@/api/data-integration/query'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const loading = ref(false)
const groups = ref([])
const totalPoints = ref(0)
const onlineRate = ref(0)
const alarmCount = ref(0)

const selectedPoint = ref(null)
const currentValue = ref(null)
const lastUpdate = ref(null)

const trendInterval = ref('1h')
const trendChartRef = ref(null)
let trendChart = null

// 水质合规颜色
function qualityColor(val, min, max) {
  if (val === null || val === undefined) return '#94A3B8'
  if (val < min || val > max) return '#EF4444'
  const margin = (max - min) * 0.2
  if (val < min + margin || val > max - margin) return '#F59E0B'
  return '#10B981'
}

function fetchPoints() {
  loading.value = true
  listQualityPoints().then(res => {
    if (res.data) {
      groups.value = res.data.groups || []
      totalPoints.value = res.data.total || 0
      onlineRate.value = 80 // placeholder, can compute from real data
      alarmCount.value = 0 // placeholder, can compute from real data
    }
  }).finally(() => { loading.value = false })
}

function selectPoint(p) {
  selectedPoint.value = p
  currentValue.value = null
  lastUpdate.value = null
  fetchLatest(p.code)
  nextTick(() => fetchTrend())
}

function fetchLatest(pointCode) {
  getLatestDataBatch({ pointCodes: pointCode }).then(res => {
    if (res.data?.[pointCode]) {
      const d = res.data[pointCode]
      currentValue.value = Number(d.value || d.val || 0)
      lastUpdate.value = d.ts ? dayjs(d.ts).format('MM-DD HH:mm:ss') : dayjs().format('MM-DD HH:mm:ss')
    }
  }).catch(() => {})
}

function fetchTrend() {
  if (!selectedPoint.value || !trendChartRef.value) return
  const p = selectedPoint.value
  let start, end
  const now = dayjs()
  if (trendInterval.value === '5m') {
    start = now.subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss')
    end = now.format('YYYY-MM-DD HH:mm:ss')
  } else if (trendInterval.value === '1h') {
    start = now.subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ss')
    end = now.format('YYYY-MM-DD HH:mm:ss')
  } else {
    start = now.subtract(7, 'day').format('YYYY-MM-DD 00:00:00')
    end = now.format('YYYY-MM-DD 23:59:59')
  }
  getQualityTrend(p.code, start, end, trendInterval.value).then(res => {
    const data = res.data?.data || res.data || []
    const dates = data.map(d => d.ts || d[0])
    const vals = data.map(d => d.val ?? d[1] ?? 0)
    renderTrendChart(dates, vals, p)
  }).catch(() => {
    renderTrendChart([], [], p)
  })
}

function renderTrendChart(dates, vals, pointInfo) {
  if (!trendChartRef.value) return
  if (!trendChart) trendChart = echarts.init(trendChartRef.value)
  const min = pointInfo.rangeMin || 0
  const max = pointInfo.rangeMax || 100
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 30, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: dates.map(d => dayjs(d).format(trendInterval.value === '1d' ? 'MM-DD' : 'HH:mm')), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 }, name: pointInfo.unit },
    visualMap: {
      show: false,
      pieces: [
        { lt: min, color: '#EF4444' },
        { gte: min, lte: max, color: '#10B981' },
        { gt: max, color: '#EF4444' },
      ],
    },
    series: [{
      type: 'line', data: vals, smooth: true, symbol: 'none',
      lineStyle: { width: 2, color: '#0D9488' },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { type: 'dashed' },
        data: [
          { yAxis: min, label: { formatter: `下限${min}`, fontSize: 10 }, lineStyle: { color: '#F59E0B' } },
          { yAxis: max, label: { formatter: `上限${max}`, fontSize: 10 }, lineStyle: { color: '#F59E0B' } },
        ],
      },
    }],
  }, true)
}

onMounted(() => { fetchPoints() })
</script>

<style lang="scss" scoped>
.water-quality { padding: 20px 24px; }

.overview-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.ov-item {
  background: #FFF;
  border-radius: 10px;
  padding: 16px 20px;
  border: 1px solid #E2E8F0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ov-label { font-size: 13px; color: #64748B; }
.ov-value { font-size: 28px; font-weight: 700; color: #0F172A; }
.ov-value.good { color: #10B981; }
.ov-value.warn { color: #F59E0B; }
.ov-value.bad { color: #EF4444; }

.wq-card {
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  box-shadow: none;
  margin-bottom: 0;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  .el-icon { color: #0D9488; }
}

.category-group {
  margin-bottom: 14px;
}

.cat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0 4px;
}

.cat-name {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.point-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all .15s;
  margin: 3px 0;
  border: 1px solid transparent;

  &:hover { background: #F0FDFA; }
  &.active { background: #F0FDFA; border-color: #0D9488; }

  .point-label { font-size: 13px; color: #334155; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .point-type-tag { font-size: 11px; color: #94A3B8; border: 1px solid #E2E8F0; border-radius: 4px; padding: 1px 6px; flex-shrink: 0; margin-left: 8px; }
}

// 实时值
.realtime-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.rt-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: #F8FAFC;
  border-radius: 8px;
}

.rt-label { font-size: 12px; color: #94A3B8; }
.rt-value { font-size: 24px; font-weight: 700; }
.rt-value.normal { font-size: 16px; color: #0D9488; }
.rt-value.code { font-size: 14px; color: #475569; font-family: monospace; }
.rt-value.time { font-size: 13px; color: #64748B; }
.rt-unit { font-size: 12px; color: #94A3B8; }

.chart-box { width: 100%; height: 300px; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  color: #94A3B8;
  p { margin-top: 12px; font-size: 14px; }
}

.empty-hint {
  text-align: center;
  color: #94A3B8;
  font-size: 13px;
  padding: 24px 0;
}

@media (max-width: 992px) {
  .realtime-grid { grid-template-columns: repeat(2, 1fr); }
  .overview-bar { grid-template-columns: repeat(3, 1fr); }
}
</style>
