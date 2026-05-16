<template>
  <div class="water-quality">
    <div class="overview-bar">
      <div class="ov-item"><span class="ov-label">监测点总数</span><span class="ov-value">{{ totalPoints }}</span></div>
      <div class="ov-item"><span class="ov-label">绑定设备</span><span class="ov-value">{{ deviceCount }}</span></div>
      <div class="ov-item"><span class="ov-label">参数类型</span><span class="ov-value">{{ paramCount }}</span></div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :lg="5">
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

      <el-col :xs="24" :lg="11">
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

      <el-col :xs="24" :lg="8">
        <div class="map-panel">
          <div class="map-container" ref="mapContainer">
            <div v-if="!mapInstance" class="map-placeholder">
              <el-icon style="font-size:36px;color:#909399;"><MapLocation /></el-icon>
              <p>{{ noMapKey ? '未配置地图Key' : '地图加载中...' }}</p>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { TrendCharts, Search, MapLocation } from '@element-plus/icons-vue'
import { listQualityPoints } from '@/api/water-basic/water-quality'
import DevicePointPanel from '@/components/Monitor/DevicePointPanel.vue'
import { useMonitorTrend } from '@/hooks/useMonitorTrend'
import { useAMap } from '@/hooks/useAMap'

const loading = ref(false)
const groups = ref([])
const totalPoints = ref(0)
const deviceCount = ref(0)
const paramCount = ref(0)

const selectedPoint = ref(null)
const currentValue = ref(null)
const lastUpdate = ref(null)

// 地图
const mapContainer = ref(null)
const { map: mapInstance, AMap: AMapNS, init: initMapFn, destroy: destroyMap } = useAMap({
  plugins: ['AMap.Marker'],
})
const noMapKey = ref(false)
let mapMarkers = []
let mapInfoWindow = null

async function initMap() {
  try { await initMapFn(mapContainer.value); renderAllPointsOnMap() } catch { noMapKey.value = true }
}

function renderAllPointsOnMap() {
  if (!mapInstance.value || !AMapNS.value) return
  mapMarkers.forEach(m => mapInstance.value.remove(m)); mapMarkers = []
  const allPoints = []
  groups.value.forEach(g => g.points.forEach(p => allPoints.push(p)))
  if (allPoints.length === 0) return
  allPoints.forEach(p => {
    const lng = p.longitude ? parseFloat(p.longitude) : (118.5 + Math.random() * 0.2)
    const lat = p.latitude ? parseFloat(p.latitude) : (24.8 + Math.random() * 0.2)
    const v = p.latestValue != null ? Number(p.latestValue) : null
    const min = p.rangeMin; const max = p.rangeMax
    let color = '#94A3B8'
    if (v !== null && min !== undefined && max !== undefined) {
      color = qualityColor(v, min, max)
    }
    const marker = new AMapNS.value.Marker({
      position: [lng, lat], title: p.name || p.code,
      icon: new AMapNS.value.Icon({ size: new AMapNS.value.Size(14, 14), image: makeMarkerDot(color), imageSize: new AMapNS.value.Size(14, 14) }),
      offset: new AMapNS.value.Pixel(-7, -7),
    })
    marker._pointData = p
    marker.on('click', () => selectPoint(p))
    mapInstance.value.add(marker); mapMarkers.push(marker)
  })
}

function makeMarkerDot(color) {
  const c = document.createElement('canvas')
  c.width = 14; c.height = 14
  const ctx = c.getContext('2d')
  ctx.beginPath(); ctx.arc(7, 7, 5, 0, Math.PI * 2)
  ctx.fillStyle = color; ctx.fill()
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke()
  return c.toDataURL()
}

function focusPointOnMap(p) {
  if (!mapInstance.value || !p) return
  const lng = p.longitude ? parseFloat(p.longitude) : null
  const lat = p.latitude ? parseFloat(p.latitude) : null
  if (!lng || !lat) return
  mapInstance.value.setZoomAndCenter(15, [lng, lat], false, 800)
  if (mapInfoWindow) { mapInstance.value.remove(mapInfoWindow); mapInfoWindow = null }
  const info = new AMapNS.value.InfoWindow({ content: `<div style="padding:4px 8px;font-size:12px;">${p.name || p.code}</div>`, offset: new AMapNS.value.Pixel(0, -20) })
  mapInfoWindow = info
  info.open(mapInstance.value, [lng, lat])
}

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
  }).finally(() => { loading.value = false; nextTick(() => renderAllPointsOnMap()) })
}

function selectPoint(p) {
  selectedPoint.value = p
  currentValue.value = p.latestValue != null ? Number(p.latestValue) : null
  lastUpdate.value = p.latestTime || null
  fetchTrend(p)
  focusPointOnMap(p)
}

function onIntervalChange() {
  if (selectedPoint.value) fetchTrend(selectedPoint.value)
}

onMounted(() => { fetchPoints(); initMap() })
onBeforeUnmount(() => { disposeTrend(); destroyMap() })
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

.map-panel { height: 100%; min-height: 400px; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden; background: #F8FAFC; }
.map-container { width: 100%; height: 100%; min-height: 400px; position: relative; }
.map-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #606266; background: radial-gradient(circle at center, #f5f7fa 0%, #e4e7ed 100%); p { margin-top: 8px; font-size: 13px; } }

@media (max-width: 992px) {
  .realtime-grid { grid-template-columns: repeat(2, 1fr); }
  .overview-bar { grid-template-columns: repeat(3, 1fr); }
  .map-panel { min-height: 300px; }
}
</style>
