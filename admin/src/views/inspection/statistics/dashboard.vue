<template>
  <div class="dashboard-container">
    <!-- KPI 卡片 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :span="4" v-for="c in kpiCards" :key="c.key">
        <div class="kpi-card">
          <div class="kpi-icon" :style="{ background: c.bg }">
            <el-icon :size="22"><component :is="c.icon" /></el-icon>
          </div>
          <div class="kpi-body">
            <span class="kpi-value" :style="{ color: c.color }">{{ c.value }}</span>
            <span class="kpi-label">{{ c.label }}</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表行 1 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="8">
        <div class="chart-card">
          <h4 class="chart-title">任务完成率</h4>
          <div ref="gaugeRef" class="chart-box"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <h4 class="chart-title">任务状态分布</h4>
          <div ref="taskPieRef" class="chart-box"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <h4 class="chart-title">问题严重度分布</h4>
          <div ref="issuePieRef" class="chart-box"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表行 2 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="14">
        <div class="chart-card">
          <h4 class="chart-title">巡检趋势 (近30天)</h4>
          <div ref="trendRef" class="chart-box"></div>
        </div>
      </el-col>
      <el-col :span="10">
        <div class="chart-card">
          <h4 class="chart-title">检查员排行榜</h4>
          <div ref="rankRef" class="chart-box"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表行 3 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="24">
        <div class="chart-card">
          <h4 class="chart-title">问题趋势 (按严重度)</h4>
          <div ref="issueTrendRef" class="chart-box"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  Checked, Clock, DataAnalysis, Warning, List, Timer
} from '@element-plus/icons-vue'
import useSettingsStore from '@/store/modules/settings'
import { getDashboard } from '@/api/inspection/statistics'

const settingsStore = useSettingsStore()
const isDark = computed(() => settingsStore.siteTheme === 'dark')

// 主题色
const t = computed(() => ({
  text: isDark.value ? '#CBD5E1' : '#374151',
  textMuted: isDark.value ? '#94A3B8' : '#6B7280',
  textLight: isDark.value ? '#64748B' : '#9CA3AF',
  bg: isDark.value ? '#0F172A' : '#F3F4F6',
  cardBg: isDark.value ? '#1E293B' : '#FFFFFF',
  cardBorder: isDark.value ? '#334155' : '#E5E7EB',
  axisLine: isDark.value ? '#475569' : '#D1D5DB',
  gridLine: isDark.value ? '#334155' : '#E5E7EB',
}))

const gaugeRef = ref(null)
const taskPieRef = ref(null)
const issuePieRef = ref(null)
const trendRef = ref(null)
const rankRef = ref(null)
const issueTrendRef = ref(null)

const kpiCards = reactive([
  { key: 'total', label: '任务总数', value: 0, icon: List, color: '#3B82F6', bg: 'rgba(59,130,246,.12)' },
  { key: 'completed', label: '已完成', value: 0, icon: Checked, color: '#10B981', bg: 'rgba(16,185,129,.12)' },
  { key: 'rate', label: '完成率', value: '0%', icon: DataAnalysis, color: '#8B5CF6', bg: 'rgba(139,92,246,.12)' },
  { key: 'issues', label: '问题总数', value: 0, icon: Warning, color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  { key: 'overdue', label: '超时任务', value: 0, icon: Timer, color: '#EF4444', bg: 'rgba(239,68,68,.12)' },
  { key: 'pending', label: '待处理', value: 0, icon: Clock, color: '#6B7280', bg: 'rgba(107,114,128,.12)' },
])

let gaugeChart, taskPieChart, issuePieChart, trendChart, rankChart, issueTrendChart
let resizeHandler
let cachedData = null

const severities = [
  { name: '严重', color: '#EF4444' },
  { name: '重要', color: '#F59E0B' },
  { name: '一般', color: '#3B82F6' },
  { name: '观察', color: '#9CA3AF' },
]

function destroyCharts() {
  gaugeChart?.dispose(); gaugeChart = null
  taskPieChart?.dispose(); taskPieChart = null
  issuePieChart?.dispose(); issuePieChart = null
  trendChart?.dispose(); trendChart = null
  rankChart?.dispose(); rankChart = null
  issueTrendChart?.dispose(); issueTrendChart = null
}

function makeGaugeOption() {
  const c = t.value
  return {
    series: [{
      type: 'gauge',
      startAngle: 210, endAngle: -30,
      center: ['50%', '55%'], radius: '85%',
      min: 0, max: 100,
      axisLine: { lineStyle: { width: 14, color: [[0.3, '#EF4444'], [0.6, '#F59E0B'], [0.8, '#3B82F6'], [1, '#10B981']] } },
      pointer: { length: '60%', width: 6, itemStyle: { color: c.text } },
      axisTick: { distance: -14, length: 6, lineStyle: { width: 1, color: c.axisLine } },
      splitLine: { distance: -22, length: 12, lineStyle: { width: 2, color: c.axisLine } },
      axisLabel: { distance: 24, fontSize: 11, color: c.textMuted },
      detail: { valueAnimation: true, formatter: '{value}%', fontSize: 28, fontWeight: 'bold', color: c.text, offsetCenter: [0, '70%'] },
      data: [{ value: 0, name: '完成率' }],
    }],
  }
}

function makePieOption(rose = false) {
  const c = t.value
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 10, color: c.textMuted } },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      roseType: rose ? 'area' : undefined,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [],
    }],
  }
}

function makeTrendOption() {
  const c = t.value
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['完成任务', '新增问题'], bottom: 0, textStyle: { fontSize: 11, color: c.textMuted } },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: [], axisLabel: { rotate: 30, fontSize: 10, color: c.textMuted }, axisLine: { lineStyle: { color: c.axisLine } } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: c.gridLine } }, axisLabel: { color: c.textMuted } },
    series: [
      { name: '完成任务', type: 'bar', data: [], itemStyle: { color: '#10B981' }, barMaxWidth: 12 },
      { name: '新增问题', type: 'line', data: [], lineStyle: { color: '#EF4444', width: 2 }, itemStyle: { color: '#EF4444' }, smooth: true },
    ],
  }
}

function makeRankOption() {
  const c = t.value
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['已完成', '超时'], bottom: 0, textStyle: { fontSize: 10, color: c.textMuted } },
    grid: { left: 80, right: 20, top: 10, bottom: 30 },
    xAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: c.gridLine } }, axisLabel: { color: c.textMuted } },
    yAxis: { type: 'category', data: [], axisLabel: { fontSize: 10, color: c.text }, inverse: true, axisLine: { lineStyle: { color: c.axisLine } } },
    series: [
      { name: '已完成', type: 'bar', data: [], itemStyle: { color: '#10B981' }, barMaxWidth: 10, stack: 'x' },
      { name: '超时', type: 'bar', data: [], itemStyle: { color: '#EF4444' }, barMaxWidth: 10, stack: 'x' },
    ],
  }
}

function makeIssueTrendOption() {
  const c = t.value
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: severities.map(s => s.name), bottom: 0, textStyle: { fontSize: 11, color: c.textMuted } },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: [], axisLabel: { rotate: 30, fontSize: 10, color: c.textMuted }, axisLine: { lineStyle: { color: c.axisLine } } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: c.gridLine } }, axisLabel: { color: c.textMuted } },
    series: severities.map(s => ({
      name: s.name, type: 'line', data: [], smooth: true,
      lineStyle: { color: s.color, width: 2 },
      itemStyle: { color: s.color },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: s.color + '4D' }, { offset: 1, color: s.color + '05' }]) },
    })),
  }
}

function initCharts() {
  if (gaugeRef.value) { gaugeChart = echarts.init(gaugeRef.value); gaugeChart.setOption(makeGaugeOption()) }
  if (taskPieRef.value) { taskPieChart = echarts.init(taskPieRef.value); taskPieChart.setOption(makePieOption()) }
  if (issuePieRef.value) { issuePieChart = echarts.init(issuePieRef.value); issuePieChart.setOption(makePieOption(true)) }
  if (trendRef.value) { trendChart = echarts.init(trendRef.value); trendChart.setOption(makeTrendOption()) }
  if (rankRef.value) { rankChart = echarts.init(rankRef.value); rankChart.setOption(makeRankOption()) }
  if (issueTrendRef.value) { issueTrendChart = echarts.init(issueTrendRef.value); issueTrendChart.setOption(makeIssueTrendOption()) }
}

function applyData() {
  if (!cachedData) return
  const data = cachedData
  const ts = data.taskStats || {}
  const is = data.issueStats || {}
  const cs = data.completionStats || {}

  kpiCards[0].value = ts.total || 0
  kpiCards[1].value = ts.completed || 0
  kpiCards[2].value = (cs.rate || 0) + '%'
  kpiCards[3].value = is.total || 0
  kpiCards[4].value = ts.overdue || 0
  kpiCards[5].value = ts.pending || 0

  if (gaugeChart) gaugeChart.setOption({ series: [{ data: [{ value: cs.rate || 0, name: '完成率' }] }] })

  if (taskPieChart) {
    const sd = [
      { value: ts.pending || 0, name: '待接收' },
      { value: ts.inProgress || 0, name: '进行中' },
      { value: ts.completed || 0, name: '已完成' },
      { value: ts.overdue || 0, name: '已超时' },
    ].filter(d => d.value > 0)
    taskPieChart.setOption({ series: [{ data: sd.length ? sd : [{ value: 1, name: '暂无数据' }], color: ['#6B7280', '#3B82F6', '#10B981', '#EF4444'] }] })
  }

  if (issuePieChart) {
    const id = [
      { value: is.critical || 0, name: '严重' },
      { value: is.open || 0, name: '未处理' },
      { value: is.resolved || 0, name: '已解决' },
    ].filter(d => d.value > 0)
    issuePieChart.setOption({ series: [{ data: id.length ? id : [{ value: 1, name: '暂无数据' }], color: ['#EF4444', '#F59E0B', '#10B981'] }] })
  }

  if (trendChart && data.trend) {
    const dates = [...new Set([...(data.trend.tasksCompleted || []).map(i => i.date), ...(data.trend.issuesCreated || []).map(i => i.date)])].sort()
    const taskMap = Object.fromEntries((data.trend.tasksCompleted || []).map(i => [i.date, Number(i.count)]))
    const issueMap = Object.fromEntries((data.trend.issuesCreated || []).map(i => [i.date, Number(i.count)]))
    trendChart.setOption({ xAxis: { data: dates }, series: [{ name: '完成任务', data: dates.map(d => taskMap[d] || 0) }, { name: '新增问题', data: dates.map(d => issueMap[d] || 0) }] })
  }

  if (rankChart && data.ranking) {
    rankChart.setOption({ yAxis: { data: data.ranking.map(r => r.name) }, series: [{ name: '已完成', data: data.ranking.map(r => Number(r.completed) || 0) }, { name: '超时', data: data.ranking.map(r => Number(r.overdue) || 0) }] })
  }
}

async function loadData() {
  try {
    const res = await getDashboard({ statPeriod: 'day' })
    cachedData = res.data || {}
    applyData()
  } catch (e) {
    console.error('加载仪表盘数据失败', e)
  }
}

// 主题切换时重建图表
watch(isDark, async () => {
  destroyCharts()
  await nextTick()
  initCharts()
  applyData()
})

onMounted(async () => {
  await nextTick()
  initCharts()
  loadData()
  resizeHandler = () => {
    gaugeChart?.resize(); taskPieChart?.resize(); issuePieChart?.resize()
    trendChart?.resize(); rankChart?.resize(); issueTrendChart?.resize()
  }
  window.addEventListener('resize', resizeHandler)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeHandler)
  destroyCharts()
})
</script>

<style scoped>
.dashboard-container {
  padding: 16px;
  background: #f3f4f6;
  min-height: calc(100vh - 84px);
}
.kpi-row { margin-bottom: 16px; }
.kpi-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 8px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.kpi-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-body { display: flex; flex-direction: column; min-width: 0; }
.kpi-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
.kpi-label { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.chart-row { margin-bottom: 16px; }
.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.chart-title { margin: 0 0 8px; font-size: 14px; color: #374151; font-weight: 600; }
.chart-box { width: 100%; height: 280px; }
</style>

<style>
/* 暗色模式覆盖 */
html.dark-mode .dashboard-container {
  background: #0F172A !important;
}
html.dark-mode .kpi-card {
  background: #1E293B !important;
  border-color: #334155 !important;
  box-shadow: 0 1px 3px rgba(0,0,0,.2) !important;
}
html.dark-mode .kpi-label {
  color: #94A3B8 !important;
}
html.dark-mode .chart-card {
  background: #1E293B !important;
  border-color: #334155 !important;
  box-shadow: 0 1px 3px rgba(0,0,0,.2) !important;
}
html.dark-mode .chart-title {
  color: #E2E8F0 !important;
}
</style>
