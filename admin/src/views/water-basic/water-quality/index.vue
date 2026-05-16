<template>
  <div class="water-quality">
    <div class="overview-bar">
      <div class="ov-item"><span class="ov-label">监测点总数</span><span class="ov-value">{{ totalPoints }}</span></div>
      <div class="ov-item"><span class="ov-label">绑定设备</span><span class="ov-value">{{ deviceCount }}</span></div>
      <div class="ov-item"><span class="ov-label">参数类型</span><span class="ov-value">{{ paramCount }}</span></div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="7">
        <DevicePointPanel
          title="设备监测点"
          :groups="groups"
          :loading="loading"
          :selected-id="selectedPoint?.id"
          empty-text="暂未配置水质监测点"
          @select="selectPoint"
        >
          <template #status="{ point }">
            <span class="point-type-tag">{{ point.typeLabel }}</span>
          </template>
        </DevicePointPanel>
      </el-col>

      <el-col :xs="24" :lg="17">
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

        <el-card shadow="never" class="wq-card" v-if="selectedPoint" style="margin-top:16px">
          <template #header>
            <div class="card-title">
              <el-icon><TrendCharts /></el-icon><span>历史趋势</span>
              <el-radio-group v-model="trendInterval" size="small" style="margin-left:12px" @change="onIntervalChange">
                <el-radio-button value="5m">6小时</el-radio-button>
                <el-radio-button value="1h">24小时</el-radio-button>
                <el-radio-button value="1d">7天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="chartBoxRef" class="chart-box"></div>
        </el-card>

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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { TrendCharts, Search } from '@element-plus/icons-vue'
import { listQualityPoints } from '@/api/water-basic/water-quality'
import DevicePointPanel from '@/components/Monitor/DevicePointPanel.vue'
import { useMonitorTrend } from '@/hooks/useMonitorTrend'
import * as echarts from 'echarts'

const loading = ref(false)
const groups = ref([])
const totalPoints = ref(0)
const deviceCount = ref(0)
const paramCount = ref(0)

const selectedPoint = ref(null)
const currentValue = ref(null)
const lastUpdate = ref(null)

const { trendInterval, chartRef: chartBoxRef, fetchTrend, dispose: disposeTrend } = useMonitorTrend({
  extraOption: ({ min, max }) => ({
    visualMap: {
      show: false,
      pieces: [
        { lt: min, color: '#EF4444' },
        { gte: min, lte: max, color: '#10B981' },
        { gt: max, color: '#EF4444' },
      ],
    },
  }),
})

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
      deviceCount.value = groups.value.length
      const types = new Set()
      groups.value.forEach(g => g.points.forEach(p => types.add(p.type)))
      paramCount.value = types.size
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
.water-quality { padding: 20px 24px; }

.overview-bar {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;
}
.ov-item {
  background: #FFF; border-radius: 10px; padding: 16px 20px; border: 1px solid #E2E8F0;
  display: flex; justify-content: space-between; align-items: center;
}
.ov-label { font-size: 13px; color: #64748B; }
.ov-value { font-size: 28px; font-weight: 700; color: #0F172A; }

.wq-card {
  border-radius: 10px; border: 1px solid #E2E8F0; box-shadow: none; margin-bottom: 0;
}

.card-title {
  display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #0F172A;
  .el-icon { color: #0D9488; }
}

.point-type-tag { font-size: 11px; color: #94A3B8; border: 1px solid #E2E8F0; border-radius: 4px; padding: 1px 6px; flex-shrink: 0; margin-left: 8px; }

.realtime-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.rt-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px; background: #F8FAFC; border-radius: 8px; }
.rt-label { font-size: 12px; color: #94A3B8; }
.rt-value { font-size: 24px; font-weight: 700; }
.rt-value.normal { font-size: 16px; color: #0D9488; }
.rt-value.code { font-size: 14px; color: #475569; font-family: monospace; }
.rt-value.time { font-size: 13px; color: #64748B; }
.rt-unit { font-size: 12px; color: #94A3B8; }

.chart-box { width: 100%; height: 300px; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 0; color: #94A3B8; p { margin-top: 12px; font-size: 14px; } }

@media (max-width: 992px) {
  .realtime-grid { grid-template-columns: repeat(2, 1fr); }
  .overview-bar { grid-template-columns: repeat(3, 1fr); }
}
</style>
