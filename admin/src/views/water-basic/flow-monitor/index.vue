<template>
  <div class="flow-monitor-page">
    <div class="overview-bar">
      <div class="ov-item"><span class="ov-label">流量监测点</span><span class="ov-value">{{ totalPoints }}</span></div>
      <div class="ov-item"><span class="ov-label">绑定设备</span><span class="ov-value">{{ deviceCount }}</span></div>
      <div class="ov-item"><span class="ov-label">流量类型</span><span class="ov-value">{{ typeCount }}</span></div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="6">
        <DevicePointPanel
          title="设备监测点"
          :groups="groups"
          :loading="loading"
          :selected-id="selectedPoint?.id"
          :status-fn="getStatus"
          empty-text="暂未配置流量监测点"
          @select="selectPoint"
        >
          <template #status="{ point }">
            <span class="p-unit">{{ point.unit }}</span>
          </template>
        </DevicePointPanel>
      </el-col>

      <el-col :xs="24" :lg="18">
        <el-card shadow="never" class="f-card" v-if="selectedPoint">
          <template #header>
            <div class="card-title">
              <el-icon><TrendCharts /></el-icon><span>实时流量 — {{ selectedPoint.name || selectedPoint.code }}</span>
              <el-radio-group v-model="trendInterval" size="small" style="margin-left:auto" @change="onIntervalChange">
                <el-radio-button value="5m">6h</el-radio-button>
                <el-radio-button value="1h">24h</el-radio-button>
                <el-radio-button value="1d">7d</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="realtime-grid">
            <div class="rt-item">
              <span class="rt-label">当前值</span>
              <span class="rt-value" :style="{ color: currentValColor }">{{ currentValStr }}</span>
              <span class="rt-unit">{{ selectedPoint.unit }}</span>
            </div>
            <div class="rt-item">
              <span class="rt-label">量程上限</span>
              <span class="rt-value normal">{{ selectedPoint.rangeMax || '--' }}</span>
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
          <div ref="chartBoxRef" class="chart-box"></div>
        </el-card>

        <el-card shadow="never" class="f-card" v-if="!selectedPoint">
          <div class="empty-state">
            <el-icon :size="48"><Search /></el-icon>
            <p>请从左侧列表选择一个流量监测点</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { TrendCharts, Search } from '@element-plus/icons-vue'
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

const { trendInterval, chartRef: chartBoxRef, fetchTrend, dispose: disposeTrend } = useMonitorTrend({
  seriesExtra: { type: 'bar', barWidth: '60%' },
})

const currentValStr = computed(() => currentValue.value !== null ? currentValue.value.toFixed(2) : '--')

const currentValColor = computed(() => {
  if (currentValue.value === null) return '#94A3B8'
  const max = selectedPoint.value?.rangeMax || 9999
  if (currentValue.value > max) return '#EF4444'
  if (currentValue.value > max * 0.9) return '#F59E0B'
  return '#2563EB'
})

function getStatus(p) {
  const v = p.latestValue
  if (v === null || v === undefined) return 'unknown'
  if (v === 0) return 'warn'
  return 'ok'
}

function fetchPoints() {
  loading.value = true
  request({ url: '/water-basic/flow-monitor/points', method: 'get' }).then(res => {
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
  fetchTrend(p)
}

function onIntervalChange() {
  if (selectedPoint.value) fetchTrend(selectedPoint.value)
}

onMounted(() => { fetchPoints() })
onBeforeUnmount(() => { disposeTrend() })
</script>

<style lang="scss" scoped>
.flow-monitor-page { padding: 20px 24px; }

.overview-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
.ov-item { background: #FFF; border-radius: 10px; padding: 16px 20px; border: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; }
.ov-label { font-size: 13px; color: #64748B; }
.ov-value { font-size: 28px; font-weight: 700; color: #0F172A; }

.f-card { border-radius: 10px; border: 1px solid #E2E8F0; box-shadow: none; margin-bottom: 0; height: 100%; }
.card-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #0F172A; .el-icon { color: #0D9488; } }

.p-unit { font-size: 11px; color: #94A3B8; margin-left: 8px; flex-shrink: 0; }

.realtime-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.rt-item { background: #F8FAFC; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.rt-label { font-size: 12px; color: #94A3B8; }
.rt-value { font-size: 24px; font-weight: 700; }
.rt-value.normal { font-size: 16px; color: #0D9488; }
.rt-value.time { font-size: 13px; color: #64748B; }
.rt-value.code { font-size: 13px; color: #475569; font-family: monospace; }
.rt-unit { font-size: 12px; color: #94A3B8; }

.chart-box { width: 100%; height: 300px; margin-top: 16px; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 80px 0; color: #94A3B8; p { margin-top: 12px; } }

@media (max-width: 992px) { .realtime-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
