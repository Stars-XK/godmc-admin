<template>
  <div class="gis-screen" :class="isDark ? 'dark' : 'light'">
    <div ref="mapContainer" class="map-area"></div>

    <!-- ====== 顶部栏 ====== -->
    <div class="glass-bar top-bar">
      <div class="top-left">
        <span class="back-btn" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </span>
        <span class="title">智慧水务 GIS 监控</span>
      </div>
      <div class="top-right">
        <span class="clock">{{ currentTime }}</span>
      </div>
    </div>

    <!-- ====== 左上 — 统计卡片 ====== -->
    <div class="stats-panel">
      <div class="glass-card stat-card" v-for="s in statCards" :key="s.key">
        <span class="stat-icon" :style="{ color: s.color }">
          <el-icon :size="20"><component :is="s.icon" /></el-icon>
        </span>
        <div class="stat-body">
          <span class="stat-value" :style="{ color: s.color }">{{ s.value }}</span>
          <span class="stat-label">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <!-- ====== 右上 — 图层面板 ====== -->
    <div class="layer-panel-wrapper">
      <GisLayerPanel
        :layers="registryLayers"
        position="top-right"
        title="图层控制"
        :collapsible="false"
        :compact="false"
        @toggle="onLayerToggle"
      />
    </div>

    <!-- ====== 左下 — 报警列表 ====== -->
    <div class="glass-panel alarm-panel">
      <div class="panel-header">
        最新报警
        <span class="alarm-count" v-if="recentAlarms.length">{{ recentAlarms.length }}</span>
      </div>
      <div class="alarm-list" v-if="recentAlarms.length">
        <div class="alarm-row" v-for="a in recentAlarms" :key="a.id || a.alarmSource">
          <span class="alarm-dot-pulse"></span>
          <div class="alarm-info">
            <span class="alarm-name">{{ a.ruleName || a.alarmContent || '报警' }}</span>
            <span class="alarm-src">{{ a.alarmSource || '--' }}</span>
          </div>
          <span class="alarm-time">{{ fmtAlarmTime(a.alarmTime) }}</span>
        </div>
      </div>
      <div v-else class="alarm-empty">暂无报警</div>
    </div>

    <!-- ====== 加载覆盖 ====== -->
    <div v-if="!loaded" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>{{ loadingText }}</p>
    </div>
    <div v-if="noKey" class="loading-overlay">
      <el-icon :size="48" color="#F87171"><Warning /></el-icon>
      <h3>缺少高德地图 Key</h3>
      <p>请在系统管理 → 参数配置中设置 gis.map.amap.key</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  ArrowLeft, Location, OfficeBuilding, Monitor, Bell, Warning
} from '@element-plus/icons-vue'
import { useAMap, getAMapConfig } from '@/hooks/useAMap'
import { useLayerRegistry } from '@/hooks/useLayerRegistry'
import GisLayerPanel from '@/components/GisLayerPanel/index.vue'
import request from '@/utils/request'

const { map, loaded, AMap, init, getBounds, onZoomChange, destroy } = useAMap({
  plugins: ['AMap.MarkerCluster', 'AMap.Marker', 'AMap.Polyline', 'AMap.Polygon'],
})

const mapContainer = ref(null)
const loadingText = ref('地图加载中...')
const noKey = ref(false)
const isDark = ref(false)
const currentTime = ref('')
let clockTimer = null

// ============ 统计数据 ============
const stats = reactive({ zones: 0, stations: 0, devices: 0, alarms: 0, pipes: 0 })
const recentAlarms = ref([])

const statCards = computed(() => [
  { key: 'zones',  icon: Location,        color: '#A78BFA', label: '分区',   value: stats.zones },
  { key: 'stations', icon: OfficeBuilding, color: '#60A5FA', label: '站点',   value: stats.stations },
  { key: 'devices',  icon: Monitor,        color: '#34D399', label: '设备',   value: stats.devices },
  { key: 'pipes',  icon: Monitor,          color: '#F59E0B', label: '管线',   value: stats.pipes },
  { key: 'alarms',   icon: Bell,           color: '#F87171', label: '报警',   value: stats.alarms },
])

// ============ 图层注册中心 ============
const registry = useLayerRegistry(map, AMap, getBounds)

// --- 通用 marker 工厂 ---
function createMarkerHTML(title, color, size) {
  return `
    <div class="gis-marker" style="width:${size}px;height:${size}px;">
      <div class="marker-glow" style="background:${color};box-shadow:0 0 ${size}px ${color}"></div>
      <div class="marker-core" style="background:${color};width:${size*0.5}px;height:${size*0.5}px;"></div>
    </div>`
}

function makeMarker(pos, title, color, size) {
  const m = new AMap.value.Marker({
    position: pos,
    title: title,
    offset: new AMap.value.Pixel(-size / 2, -size / 2),
  })
  m.setContent(createMarkerHTML(title, color, size))
  m.on('click', () => map.value.setZoomAndCenter(15, pos))
  return m
}

// --- 分区图层 ---
registry.register({
  key: 'zone', label: '分区', color: '#A78BFA',
  minZoom: 3, maxZoom: 24,
  renderStrategy: 'markerCluster',
  clusterGridSize: 100, clusterMaxZoom: 14,
  async fetchFn() {
    const res = await request({ url: '/gis/layers', method: 'get' })
    return res.data?.zones || { rows: [], total: 0 }
  },
  renderFn(rows, mapInst) {
    const filtered = rows.filter(z => z.longitude && z.latitude)
    stats.zones = filtered.length
    if (!filtered.length) return []
    return new AMap.value.MarkerCluster(mapInst, filtered.map(z =>
      makeMarker([Number(z.longitude), Number(z.latitude)], z.name || z.code, '#A78BFA', 20)
    ), { gridSize: 100, maxZoom: 14 })
  },
  clearFn(overlays) { overlays.forEach(o => o.setMap(null)) },
})

// --- 站点图层 ---
registry.register({
  key: 'station', label: '站点', color: '#60A5FA',
  minZoom: 3, maxZoom: 24,
  renderStrategy: 'markerCluster',
  clusterGridSize: 80, clusterMaxZoom: 15,
  async fetchFn() {
    const res = await request({ url: '/gis/layers', method: 'get' })
    return res.data?.stations || { rows: [], total: 0 }
  },
  renderFn(rows, mapInst) {
    const filtered = rows.filter(s => s.longitude && s.latitude)
    stats.stations = filtered.length
    const markers = filtered.map(s => {
      const status = s.iotStatus || '0'
      const color = status === '3' ? '#EF4444' : status === '2' ? '#F59E0B' : '#60A5FA'
      return makeMarker([Number(s.longitude), Number(s.latitude)], s.name || s.code, color, 18)
    })
    return new AMap.value.MarkerCluster(mapInst, markers, { gridSize: 80, maxZoom: 15 })
  },
  clearFn(overlays) { overlays.forEach(o => o.setMap(null)) },
})

// --- 设备图层 ---
registry.register({
  key: 'device', label: '设备', color: '#34D399',
  minZoom: 3, maxZoom: 24,
  renderStrategy: 'markerCluster',
  clusterGridSize: 60, clusterMaxZoom: 17,
  async fetchFn() {
    const res = await request({ url: '/gis/layers', method: 'get' })
    return res.data?.devices || { rows: [], total: 0 }
  },
  renderFn(rows, mapInst) {
    const filtered = rows.filter(d => d.longitude && d.latitude)
    stats.devices = filtered.length
    const markers = filtered.map(d => {
      const status = d.iotStatus || '0'
      const color = status === '3' ? '#EF4444' : status === '2' ? '#F59E0B' : '#34D399'
      return makeMarker([Number(d.longitude), Number(d.latitude)], d.name || d.code, color, 14)
    })
    return new AMap.value.MarkerCluster(mapInst, markers, { gridSize: 60, maxZoom: 17 })
  },
  clearFn(overlays) { overlays.forEach(o => o.setMap(null)) },
})

// --- 报警图层 ---
let alarmMarkers = []
registry.register({
  key: 'alarm', label: '报警', color: '#F87171',
  minZoom: 3, maxZoom: 24,
  renderStrategy: 'marker',
  async fetchFn() {
    const res = await request({ url: '/gis/layers', method: 'get' })
    const alarms = res.data?.alarms || { rows: [], total: 0 }
    const devices = (res.data?.devices?.rows || [])
    return { alarms: alarms.rows || [], devices }
  },
  renderFn(data, mapInst) {
    alarmMarkers = []
    const devices = data.devices || []
    const alarms = data.alarms || []
    stats.alarms = alarms.length
    recentAlarms.value = alarms.slice(0, 5)

    alarms.forEach(a => {
      const device = devices.find(d => d.code === a.alarmSource || d.name === a.alarmSource)
      if (!device || !device.longitude || !device.latitude) return
      const marker = new AMap.value.Marker({
        position: [Number(device.longitude), Number(device.latitude)],
        offset: new AMap.value.Pixel(-12, -12),
        zIndex: 100,
      })
      marker.setContent(`
        <div class="alarm-marker">
          <div class="alarm-ripple"></div>
          <div class="alarm-core"></div>
        </div>`)
      marker.setTitle(a.ruleName || '报警')
      mapInst.add(marker)
      alarmMarkers.push(marker)
    })
    return alarmMarkers
  },
  clearFn() {
    alarmMarkers.forEach(m => { try { map.value?.remove(m) } catch {} })
    alarmMarkers = []
  },
})

// --- 管线图层 ---
let pipePolylines = []
registry.register({
  key: 'pipe', label: '管线', color: '#F59E0B',
  minZoom: 13, maxZoom: 24,
  renderStrategy: 'polyline',
  async fetchFn(bbox) {
    if (!bbox) return { rows: [] }
    const zoom = map.value?.getZoom() || 14
    const res = await request({
      url: '/gis/pipes',
      method: 'get',
      params: { ...bbox, zoom },
    })
    return res.data || { rows: [] }
  },
  renderFn(rows, mapInst) {
    pipePolylines = []
    stats.pipes = rows.length
    if (!rows.length) return []

    const lines = []
    for (const pipe of rows) {
      const coords = pipe.coordinates || []
      if (coords.length < 2) continue
      const dn = pipe.diameter || 0
      const strokeWeight = dn >= 600 ? 3 : dn >= 300 ? 2 : 1
      const strokeColor = dn >= 600 ? '#3B82F6' : dn >= 300 ? '#60A5FA' : '#93C5FD'
      const strokeOpacity = map.value.getZoom() < 15 ? 0.5 : 0.8

      const polyline = new AMap.value.Polyline({
        path: coords,
        strokeColor,
        strokeWeight,
        strokeOpacity,
        strokeStyle: 'solid',
        lineJoin: 'round',
        lineCap: 'round',
        zIndex: 10,
      })
      polyline.setMap(mapInst)
      pipePolylines.push(polyline)
    }
    return pipePolylines
  },
  clearFn() {
    pipePolylines.forEach(p => { try { map.value?.remove(p) } catch {} })
    pipePolylines = []
  },
})

const registryLayers = computed(() => registry.layers.value)

function onLayerToggle(key) {
  registry.toggle(key)
}

// ============ 数据全部加载 ============
async function loadAllLayers() {
  loadingText.value = '加载数据中...'
  await registry.refreshAll()
}

// ============ 时钟 ============
function startClock() {
  const pad = n => String(n).padStart(2, '0')
  const tick = () => {
    const d = new Date()
    currentTime.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  tick()
  clockTimer = setInterval(tick, 1000)
}

function fmtAlarmTime(t) {
  if (!t) return '--'
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ============ 生命周期 ============
onMounted(async () => {
  // 检查配置
  const config = await getAMapConfig()
  if (!config.key) {
    noKey.value = true
    return
  }
  isDark.value = config.style.includes('dark')

  await nextTick()
  const mapInst = await init(mapContainer.value)
  if (!mapInst) return

  // 连接 zoom 变化 → 图层自动刷新
  registry.bindZoom({ onZoomChange })

  // 视口移动时刷新管线图层
  let moveTimer = null
  mapInst.on('moveend', () => {
    if (moveTimer) clearTimeout(moveTimer)
    moveTimer = setTimeout(() => {
      const zoom = mapInst.getZoom()
      if (zoom >= 13) {
        registry.fetchAndRender(registry.getLayer('pipe'))
      }
    }, 500)
  })

  await loadAllLayers()
  startClock()
})

onBeforeUnmount(() => {
  registry.destroy()
  destroy()
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style lang="scss" scoped>
/* 同原有样式，保持不変 */
.gis-screen {
  width: 100vw; height: 100vh; position: relative; overflow: hidden;
  background: #0B1120;
  &.light { background: #F1F5F9; }
  --glass-bg: rgba(15, 23, 42, 0.7);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-text: #CBD5E1;
  --glass-sub: #64748B;
  --glass-highlight: rgba(255, 255, 255, 0.04);
  &.light {
    --glass-bg: rgba(255, 255, 255, 0.72);
    --glass-border: rgba(0, 0, 0, 0.06);
    --glass-text: #1E293B;
    --glass-sub: #94A3B8;
    --glass-highlight: rgba(255, 255, 255, 0.6);
  }
}

.map-area { width: 100%; height: 100%; }

/* ========== 玻璃基底 ========== */
.glass-bar, .glass-panel, .glass-card {
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  background: var(--glass-bg);
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
    pointer-events: none;
  }
}

/* ========== 顶部栏 ========== */
.top-bar {
  position: absolute; top: 16px; left: 16px; right: 16px; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px; height: 52px;
}
.top-left { display: flex; align-items: center; gap: 12px; }
.back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 10px;
  background: rgba(255,255,255,0.06); cursor: pointer;
  transition: all 0.2s;
  color: var(--glass-sub);
  &:hover { background: rgba(94, 234, 212, 0.15); color: #5EEAD4; }
}
.title { font-size: 17px; font-weight: 700; color: var(--glass-text); letter-spacing: 0.5px; }
.clock {
  font-size: 13px; color: var(--glass-sub); font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}

/* ========== 统计面板 ========== */
.stats-panel {
  position: absolute; top: 84px; left: 16px; z-index: 10;
  display: flex; flex-direction: column; gap: 10px;
}
.stat-card {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 18px; min-width: 180px;
  cursor: default; transition: transform 0.2s, border-color 0.2s;
  &:hover { transform: translateX(4px); border-color: rgba(255,255,255,0.15); }
}
.stat-icon {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.05);
}
.stat-value { font-size: 26px; font-weight: 700; line-height: 1; }
.stat-label { font-size: 12px; color: var(--glass-sub); }

/* ========== 图层面板容器 ========== */
.layer-panel-wrapper {
  position: absolute; top: 84px; right: 16px; z-index: 10;
  width: 190px;
}

/* ========== 报警列表 ========== */
.alarm-panel {
  position: absolute; bottom: 24px; left: 16px; z-index: 10;
  width: 320px; max-height: 280px; padding: 14px 16px; overflow-y: auto;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
}
.panel-header {
  font-size: 13px; font-weight: 600; color: var(--glass-text);
  margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
}
.alarm-count {
  font-size: 11px; padding: 2px 8px; border-radius: 10px;
  background: rgba(239,68,68,0.2); color: #F87171;
  font-weight: 600;
}
.alarm-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
  &:last-child { border-bottom: none; }
}
.alarm-dot-pulse {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  background: #EF4444;
  animation: alarmPulse 1.5s infinite;
}
.alarm-info { flex: 1; min-width: 0; }
.alarm-name { display: block; font-size: 13px; color: var(--glass-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.alarm-src  { font-size: 11px; color: var(--glass-sub); }
.alarm-time { font-size: 11px; color: var(--glass-sub); flex-shrink: 0; }
.alarm-empty { font-size: 13px; color: var(--glass-sub); text-align: center; padding: 16px 0; }

/* ========== 加载覆盖 ========== */
.loading-overlay {
  position: absolute; inset: 0; z-index: 20;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: rgba(11,17,32,0.85); color: #94A3B8;
  .loading-spinner {
    width: 48px; height: 48px; border-radius: 50%;
    border: 3px solid rgba(255,255,255,0.1);
    border-top-color: #5EEAD4;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }
  h3 { margin: 8px 0 4px; font-size: 18px; color: var(--glass-text); }
  p { margin: 0 0 16px; font-size: 14px; color: var(--glass-sub); }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes alarmPulse {
  0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
  70%  { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
  100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
}
@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.25; }
  50%      { transform: scale(1.2); opacity: 0.45; }
}
@keyframes ripplePulse {
  0%   { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2.8); opacity: 0; }
}

/* 高德地图控件隐藏 */
:deep(.amap-logo), :deep(.amap-copyright) { display: none !important; }

/* Marker 样式（全局，因为 setContent 的 HTML 不受 scoped 控制） */
</style>

<style lang="scss">
/* Marker 内容样式 — 非 scoped, 因为通过 setContent 注入 */
.gis-marker {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  animation: glowPulse 2s ease-in-out infinite;
}
.marker-glow {
  position: absolute; inset: 0; border-radius: 50%;
  opacity: 0.3;
}
.marker-core {
  border-radius: 50%; position: relative; z-index: 1;
  border: 2px solid rgba(255,255,255,0.7);
}
.alarm-marker {
  width: 24px; height: 24px; position: relative;
  display: flex; align-items: center; justify-content: center;
}
.alarm-ripple {
  position: absolute; inset: 0; border-radius: 50%;
  background: rgba(239,68,68,0.3);
  animation: ripplePulse 1.5s ease-out infinite;
}
.alarm-core {
  width: 12px; height: 12px; border-radius: 50%;
  background: #EF4444; border: 2px solid #fff;
  position: relative; z-index: 1;
}
</style>
