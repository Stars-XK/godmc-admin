<template>
  <div class="gis-screen" :class="isDark ? 'dark' : 'light'">
    <div ref="mapRef" class="map-area"></div>

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
    <div class="glass-panel layers-panel">
      <div class="panel-header">图层控制</div>
      <div class="layer-row" v-for="l in layerItems" :key="l.key"
        :class="{ active: layers[l.key] }" @click="toggleLayer(l.key)">
        <span class="layer-dot" :style="{ background: l.color }"></span>
        <span class="layer-name">{{ l.label }}</span>
        <span class="layer-switch" :class="{ on: layers[l.key] }"></span>
      </div>
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
            <span class="alarm-name">{{ a.ruleName || a.alarmType || '未知报警' }}</span>
            <span class="alarm-src">{{ a.alarmSource || '--' }}</span>
          </div>
          <span class="alarm-time">{{ fmtAlarmTime(a.alarmTime) }}</span>
        </div>
      </div>
      <div class="alarm-empty" v-else>暂无活跃报警</div>
    </div>

    <!-- ====== 加载 / 无 Key ====== -->
    <div v-if="loading" class="glass-overlay">
      <div class="glass-card loading-card">
        <el-icon class="spin-icon" :size="36"><Loading /></el-icon>
        <span>{{ loadingText }}</span>
      </div>
    </div>

    <div v-if="noKey" class="glass-overlay">
      <div class="glass-card no-key-card">
        <el-icon :size="44" color="#F59E0B"><WarningFilled /></el-icon>
        <h3>未配置高德地图 Key</h3>
        <p>请在 <strong>系统配置 → GIS地图配置</strong> 中填写高德地图 Key 和安全密钥</p>
        <el-button type="primary" @click="$router.push('/system/config')">前往配置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  ArrowLeft, Loading, WarningFilled,
  Location, OfficeBuilding, Monitor, Bell
} from '@element-plus/icons-vue'
import { getConfigKey } from '@/api/system/config'
import request from '@/utils/request'
import AMapLoader from '@amap/amap-jsapi-loader'

const isDark = ref(false)
const loading = ref(true)
const loadingText = ref('地图加载中...')
const noKey = ref(false)
const currentTime = ref('')

let clockTimer = null

// ============ 统计数据 ============
const stats = reactive({ zones: 0, stations: 0, devices: 0, alarms: 0 })
const recentAlarms = ref([])

const statCards = computed(() => [
  { key: 'zones',  icon: Location,        color: '#A78BFA', label: '分区',   value: stats.zones },
  { key: 'stations', icon: OfficeBuilding, color: '#60A5FA', label: '站点',   value: stats.stations },
  { key: 'devices',  icon: Monitor,        color: '#34D399', label: '设备',   value: stats.devices },
  { key: 'alarms',   icon: Bell,           color: '#F87171', label: '报警',   value: stats.alarms },
])

// ============ 图层 ============
const layers = reactive({ zone: true, station: true, device: true, alarm: true })
const layerItems = [
  { key: 'zone',    label: '分区', color: '#A78BFA' },
  { key: 'station', label: '站点', color: '#60A5FA' },
  { key: 'device',  label: '设备', color: '#34D399' },
  { key: 'alarm',   label: '报警', color: '#F87171' },
]

// ============ 地图 ============
const mapRef = ref(null)
let map = null
let deviceCluster = null
let stationCluster = null
let zoneCluster = null
let alarmMarkers = []

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

// ============ 地图初始化 ============
async function initMap() {
  let amapKey = ''
  let amapSecurity = ''
  let mapStyle = 'amap://styles/light'

  try {
    const [keyRes, secRes, styleRes] = await Promise.all([
      getConfigKey('gis.map.amap.key'),
      getConfigKey('gis.map.amap.security'),
      getConfigKey('gis.map.style'),
    ])
    if (keyRes && keyRes.data) amapKey = keyRes.data
    if (secRes && secRes.data) amapSecurity = secRes.data
    if (styleRes && styleRes.data) mapStyle = styleRes.data
    isDark.value = mapStyle.includes('dark')
  } catch (e) {
    console.warn('配置加载失败', e)
  }

  if (!amapKey) {
    loading.value = false
    noKey.value = true
    return
  }

  if (amapSecurity) {
    window._AMapSecurityConfig = { securityJsCode: amapSecurity }
  }

  try {
    const AMap = await AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.MarkerCluster', 'AMap.Marker']
    })
    window.AMap = AMap

    await nextTick()
    map = new AMap.Map(mapRef.value, {
      zoom: 12,
      center: [118.6, 24.9],
      mapStyle: mapStyle,
      viewMode: '2D',
      resizeEnable: true
    })

    loadingText.value = '加载数据中...'
    await loadAllData()
    loading.value = false
  } catch (e) {
    console.error('地图加载失败', e)
    loading.value = false
  }
}

// ============ 数据加载 ============
async function loadAllData() {
  try {
    const res = await request({ url: '/gis/layers', method: 'get' })
    const { zones: zRes, stations: sRes, devices: dRes, alarms: aRes } = res.data || {}

    stats.zones = zRes?.total || 0
    stats.stations = sRes?.total || 0
    stats.devices = dRes?.total || 0
    stats.alarms = aRes?.total || 0

    const zones = (zRes?.rows || []).filter(z => z.longitude && z.latitude)
    const stations = (sRes?.rows || []).filter(s => s.longitude && s.latitude)
    const devices = (dRes?.rows || []).filter(d => d.longitude && d.latitude)
    const alarms = (aRes?.rows || [])

    // 最近5条报警
    recentAlarms.value = alarms.slice(0, 5)

    renderZones(zones)
    renderStations(stations)
    renderDevices(devices)
    renderAlarms(alarms, devices)
  } catch (e) {
    console.warn('数据加载失败', e)
  }
}

// ============ 渲染 ============
function renderZones(zones) {
  clearCluster(zoneCluster)
  if (!zones.length) return
  zoneCluster = new window.AMap.MarkerCluster(map, zones.map(z =>
    createMarker([Number(z.longitude), Number(z.latitude)], z.name || z.code, '#A78BFA', 20, 'zone')
  ), { gridSize: 100, maxZoom: 14 })
}

function renderStations(stations) {
  clearCluster(stationCluster)
  if (!stations.length) return
  stationCluster = new window.AMap.MarkerCluster(map, stations.map(s => {
    const status = s.iotStatus || '0'
    const color = status === '3' ? '#EF4444' : status === '2' ? '#F59E0B' : '#60A5FA'
    return createMarker([Number(s.longitude), Number(s.latitude)], s.name || s.code, color, 18, 'station')
  }), { gridSize: 80, maxZoom: 15 })
}

function renderDevices(devices) {
  clearCluster(deviceCluster)
  if (!devices.length) return
  deviceCluster = new window.AMap.MarkerCluster(map, devices.map(d => {
    const status = d.iotStatus || '0'
    const color = status === '3' ? '#EF4444' : status === '2' ? '#F59E0B' : '#34D399'
    return createMarker([Number(d.longitude), Number(d.latitude)], d.name || d.code, color, 14, 'device')
  }), { gridSize: 60, maxZoom: 17 })
}

function renderAlarms(alarms, devices) {
  clearAlarmMarkers()
  alarms.forEach(a => {
    const device = devices.find(d => d.code === a.alarmSource || d.name === a.alarmSource)
    if (!device || !device.longitude || !device.latitude) return
    const marker = new window.AMap.Marker({
      position: [Number(device.longitude), Number(device.latitude)],
      offset: new window.AMap.Pixel(-12, -12),
      zIndex: 100,
    })
    marker.setContent(`
      <div class="alarm-marker">
        <div class="alarm-ripple"></div>
        <div class="alarm-core"></div>
      </div>`)
    marker.setTitle(a.ruleName || '报警')
    map.add(marker)
    alarmMarkers.push(marker)
  })
}

// ============ 辅助 ============
function createMarker(pos, title, color, size, type) {
  const m = new window.AMap.Marker({
    position: pos,
    title: title,
    offset: new window.AMap.Pixel(-size / 2, -size / 2),
  })
  m.setContent(`
    <div class="gis-marker" style="width:${size}px;height:${size}px;">
      <div class="marker-glow" style="background:${color};box-shadow:0 0 ${size}px ${color}"></div>
      <div class="marker-core" style="background:${color};width:${size*0.5}px;height:${size*0.5}px;"></div>
    </div>`)
  m.on('click', () => map.setZoomAndCenter(15, pos))
  return m
}

function clearCluster(c) { c && c.setMap(null) }

function clearAlarmMarkers() {
  alarmMarkers.forEach(m => map && map.remove(m))
  alarmMarkers = []
}

function toggleLayer(key) {
  layers[key] = !layers[key]
  const on = layers[key]
  if (key === 'device')  on ? deviceCluster && deviceCluster.setMap(map) : deviceCluster && deviceCluster.setMap(null)
  if (key === 'zone')    on ? zoneCluster && zoneCluster.setMap(map)   : zoneCluster && zoneCluster.setMap(null)
  if (key === 'station') on ? stationCluster && stationCluster.setMap(map) : stationCluster && stationCluster.setMap(null)
  if (key === 'alarm')   on ? alarmMarkers.forEach(m => map && map.add(m)) : alarmMarkers.forEach(m => map && map.remove(m))
}

function fmtAlarmTime(t) {
  if (!t) return '--'
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ============ 生命周期 ============
onMounted(() => {
  initMap()
  startClock()
})

onBeforeUnmount(() => {
  clearCluster(deviceCluster)
  clearCluster(stationCluster)
  clearCluster(zoneCluster)
  clearAlarmMarkers()
  if (clockTimer) clearInterval(clockTimer)
  if (map) { map.destroy(); map = null }
})
</script>

<style lang="scss" scoped>
/* ========== 全局基底 ========== */
.gis-screen {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 200;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
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

.map-area {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  min-width: 100vw; min-height: 100vh;
}

/* ========== 玻璃基底 Mixin ========== */
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

/* ========== 统计卡片组 (左上) ========== */
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

/* ========== 图层面板 (右上) ========== */
.layers-panel {
  position: absolute; top: 84px; right: 16px; z-index: 10;
  width: 180px; padding: 14px 16px;
}
.panel-header {
  font-size: 13px; font-weight: 600; color: var(--glass-text);
  margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
}
.layer-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 10px; cursor: pointer;
  transition: background 0.2s;
  &:hover { background: rgba(255,255,255,0.04); }
}
.layer-dot {
  width: 10px; height: 10px; border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}
.layer-name { flex: 1; font-size: 13px; color: var(--glass-text); }
.layer-switch {
  width: 36px; height: 20px; border-radius: 10px;
  background: rgba(255,255,255,0.12); transition: background 0.25s;
  position: relative;
  &::after {
    content: '';
    position: absolute; top: 3px; left: 3px;
    width: 14px; height: 14px; border-radius: 50%;
    background: #fff; transition: transform 0.25s;
  }
  &.on {
    background: rgba(94, 234, 212, 0.5);
    &::after { transform: translateX(16px); }
  }
}
.alarm-count {
  font-size: 11px; padding: 2px 8px; border-radius: 10px;
  background: rgba(239,68,68,0.2); color: #F87171;
  font-weight: 600;
}

/* ========== 报警面板 (左下) ========== */
.alarm-panel {
  position: absolute; bottom: 24px; left: 16px; z-index: 10;
  width: 280px; padding: 14px 16px; max-height: 220px;
  display: flex; flex-direction: column;
}
.alarm-list { overflow-y: auto; flex: 1; }
.alarm-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 6px; border-radius: 8px;
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.03); }
  & + & { border-top: 1px solid rgba(255,255,255,0.04); }
}
.alarm-dot-pulse {
  width: 8px; height: 8px; border-radius: 50%; background: #EF4444;
  flex-shrink: 0;
  box-shadow: 0 0 0 4px rgba(239,68,68,0.25);
  animation: alarmPulse 2s ease-out infinite;
}
.alarm-info { flex: 1; min-width: 0; }
.alarm-name { display: block; font-size: 13px; color: var(--glass-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.alarm-src  { font-size: 11px; color: var(--glass-sub); }
.alarm-time { font-size: 11px; color: var(--glass-sub); flex-shrink: 0; }
.alarm-empty { font-size: 13px; color: var(--glass-sub); text-align: center; padding: 16px 0; }

/* ========== 遮罩 ========== */
.glass-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  background: rgba(15,23,42,0.85);
  backdrop-filter: blur(4px);
}
.light .glass-overlay { background: rgba(248,250,252,0.8); }
.loading-card, .no-key-card {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 32px 40px; text-align: center; color: var(--glass-sub);
}
.no-key-card {
  max-width: 400px;
  h3 { margin: 8px 0 4px; font-size: 18px; color: var(--glass-text); }
  p { margin: 0 0 16px; font-size: 14px; color: var(--glass-sub); }
}
.spin-icon { animation: spin 1s linear infinite; }

/* ========== 动画 ========== */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes alarmPulse {
  0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
  70%  { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
  100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
}
</style>

<!-- ========== 全局样式（地图 marker 注入用，不加 scoped） ========== -->
<style>
.amap-logo, .amap-copyright { display: none !important; }

.gis-marker {
  position: relative; display: flex; align-items: center; justify-content: center;
}
.gis-marker .marker-glow {
  position: absolute; border-radius: 50%; opacity: 0.3;
  width: 100%; height: 100%;
  animation: glowPulse 2s ease-out infinite;
}
.gis-marker .marker-core {
  border-radius: 50%; border: 2px solid rgba(255,255,255,0.9);
  z-index: 1; position: relative;
}

.alarm-marker {
  position: relative; width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
}
.alarm-marker .alarm-ripple {
  position: absolute; width: 24px; height: 24px;
  border-radius: 50%; background: rgba(239,68,68,0.25);
  animation: ripplePulse 1.8s ease-out infinite;
}
.alarm-marker .alarm-core {
  width: 12px; height: 12px; border-radius: 50%;
  background: #EF4444; border: 2px solid #fff; z-index: 1; position: relative;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.25; }
  50%      { transform: scale(1.2); opacity: 0.45; }
}
@keyframes ripplePulse {
  0%   { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2.8); opacity: 0; }
}
</style>
