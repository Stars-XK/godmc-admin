<template>
  <div class="pressure-page">
    <div class="overview-bar">
      <div class="ov-item"><span class="ov-label">压力监测点</span><span class="ov-value">{{ totalPoints }}</span></div>
      <div class="ov-item"><span class="ov-label">绑定设备</span><span class="ov-value">{{ deviceCount }}</span></div>
      <div class="ov-item"><span class="ov-label">压力类型</span><span class="ov-value">{{ typeCount }}</span></div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="6">
        <DevicePointPanel
          title="设备监测点"
          :groups="groups"
          :loading="loading"
          :selected-id="selectedPoint?.id"
          :status-fn="getStatus"
          empty-text="暂未配置压力监测点"
          @select="selectPoint"
        />
      </el-col>

      <el-col :xs="24" :lg="18">
        <el-card shadow="never" class="p-card" v-if="selectedPoint">
          <template #header>
            <div class="card-title">
              <el-icon><Odometer /></el-icon><span>实时压力 — {{ selectedPoint.name || selectedPoint.code }}</span>
              <el-radio-group v-model="trendInterval" size="small" style="margin-left:auto" @change="onIntervalChange">
                <el-radio-button value="5m">6h</el-radio-button>
                <el-radio-button value="1h">24h</el-radio-button>
                <el-radio-button value="1d">7d</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="gauge-row">
            <div ref="gaugeRef" class="gauge-box"></div>
            <div class="gauge-info">
              <div class="gi-item"><span class="gi-label">当前压力</span><span class="gi-value" :style="{ color: pressureColor(currentValue, selectedPoint.rangeMax) }">{{ currentValStr }} <small>MPa</small></span></div>
              <div class="gi-item"><span class="gi-label">量程上限</span><span class="gi-value normal">{{ selectedPoint.rangeMax }} MPa</span></div>
              <div class="gi-item"><span class="gi-label">更新时间</span><span class="gi-value time">{{ lastUpdate || '--' }}</span></div>
              <div class="gi-item"><span class="gi-label">测点编码</span><span class="gi-value code">{{ selectedPoint.code }}</span></div>
            </div>
          </div>
          <div ref="chartBoxRef" class="chart-box"></div>
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
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Odometer, Search } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import request from '@/utils/request'
import DevicePointPanel from '@/components/Monitor/DevicePointPanel.vue'
import { useMonitorTrend } from '@/hooks/useMonitorTrend'

const loading = ref(false)
const groups = ref([])
const totalPoints = ref(0)
const deviceCount = ref(0)
const typeCount = ref(0)

const selectedPoint = ref(null)
const currentValue = ref(null)
const lastUpdate = ref(null)

const gaugeRef = ref(null)
let gaugeChart = null

const { trendInterval, chartRef: chartBoxRef, fetchTrend, dispose: disposeTrend } = useMonitorTrend({ unit: 'MPa' })

const currentValStr = computed(() => currentValue.value !== null ? currentValue.value.toFixed(3) : '--')

function pressureColor(val, max) {
  if (val === null || val === undefined) return '#94A3B8'
  if (val > max) return '#EF4444'
  if (val > max * 0.9) return '#F59E0B'
  return '#10B981'
}

function getStatus(p) {
  const v = p.latestValue
  if (v === null || v === undefined) return 'unknown'
  const max = p.rangeMax || 1.6
  if (v > max) return 'bad'
  if (v > max * 0.9) return 'warn'
  return 'ok'
}

function fetchPoints() {
  loading.value = true
  request({ url: '/water-basic/pressure/points', method: 'get' }).then(res => {
    if (res.data) {
      groups.value = res.data.groups || []
      totalPoints.value = res.data.total || 0
      deviceCount.value = groups.value.length
      const types = new Set()
      groups.value.forEach(g => g.points.forEach(p => types.add(p.type)))
      typeCount.value = types.size
    }
  }).finally(() => { loading.value = false })
}

function selectPoint(p) {
  selectedPoint.value = p
  currentValue.value = p.latestValue != null ? Number(p.latestValue) : null
  lastUpdate.value = p.latestTime || null
  nextTick(() => { renderGauge(); fetchTrend(p) })
}

function onIntervalChange() {
  if (selectedPoint.value) fetchTrend(selectedPoint.value)
}

function renderGauge() {
  if (!gaugeRef.value || !selectedPoint.value) return
  if (!gaugeChart) gaugeChart = echarts.init(gaugeRef.value)
  const max = selectedPoint.value.rangeMax || 1.6
  const val = currentValue.value ?? 0
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

onMounted(() => { fetchPoints() })
onBeforeUnmount(() => { disposeTrend(); if (gaugeChart) gaugeChart.dispose() })
</script>

<style lang="scss" scoped>
.pressure-page { padding: 20px 24px; }

.overview-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
.ov-item { background: #FFF; border-radius: 10px; padding: 16px 20px; border: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; }
.ov-label { font-size: 13px; color: #64748B; }
.ov-value { font-size: 28px; font-weight: 700; color: #0F172A; }

.p-card { border-radius: 10px; border: 1px solid #E2E8F0; box-shadow: none; margin-bottom: 0; height: 100%; }
.card-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #0F172A; .el-icon { color: #0D9488; } }

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

@media (max-width: 992px) { .gauge-row { flex-direction: column; } }
</style>
