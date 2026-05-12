<template>
  <div class="gis-screen" :class="isDark ? 'dark' : 'light'">
    <div ref="mapRef" class="map-area"></div>

    <!-- 顶部栏 -->
    <div class="top-bar">
      <el-icon class="back-btn" @click="$router.back()"><ArrowLeft /></el-icon>
      <span class="title">智慧水务 GIS 监控</span>
      <span class="subtitle">
        {{ stats.zones }} 分区 · {{ stats.stations }} 站点 · {{ stats.devices }} 设备 · {{ stats.alarms }} 报警
      </span>
    </div>

    <!-- 底部图例 -->
    <div class="legend-bar">
      <span class="legend-item" @click="toggleLayer('device')" :class="{ active: layers.device }">
        <i class="dot device"></i>设备
      </span>
      <span class="legend-item" @click="toggleLayer('zone')" :class="{ active: layers.zone }">
        <i class="dot zone"></i>分区
      </span>
      <span class="legend-item" @click="toggleLayer('station')" :class="{ active: layers.station }">
        <i class="dot station"></i>站点
      </span>
      <span class="legend-item" @click="toggleLayer('alarm')" :class="{ active: layers.alarm }">
        <i class="dot alarm"></i>报警
      </span>
    </div>

    <!-- 加载提示 -->
    <div v-if="loading" class="loading-mask">
      <el-icon class="loading-icon" :size="40"><Loading /></el-icon>
      <span>{{ loadingText }}</span>
    </div>

    <!-- 无 Key 提示 -->
    <div v-if="noKey" class="no-key-mask">
      <div class="no-key-card">
        <el-icon :size="48"><WarningFilled /></el-icon>
        <h3>未配置高德地图 Key</h3>
        <p>请在 <strong>系统配置 → GIS地图配置</strong> 中填写高德地图 Key 和安全密钥</p>
        <el-button type="primary" @click="$router.push('/system/config')">前往配置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ArrowLeft, Loading, WarningFilled } from '@element-plus/icons-vue'
import { getConfigKey } from '@/api/system/config'
import { listStation, listDevice, listPoint } from '@/api/water-basic/equipment'
import { listZone } from '@/api/water-basic/zone'
import { listHistory } from '@/api/alarm/history'
import AMapLoader from '@amap/amap-jsapi-loader'

const isDark = ref(false)
const loading = ref(true)
const loadingText = ref('地图加载中...')
const noKey = ref(false)
const stats = ref({ zones: 0, stations: 0, devices: 0, alarms: 0 })

const mapRef = ref(null)
let map = null
let deviceCluster = null
let stationCluster = null
let zoneCluster = null
let alarmMarkers = []

const layers = ref({ device: true, station: true, alarm: true, zone: true })

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

    // 加载所有数据
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
    const [zRes, sRes, dRes, aRes] = await Promise.all([
      listZone({ pageNum: 1, pageSize: 500, type: '' }),
      listStation({ pageNum: 1, pageSize: 500 }),
      listDevice({ pageNum: 1, pageSize: 1000 }),
      listHistory({ pageNum: 1, pageSize: 50, status: '0' }),
    ])

    stats.value.zones = zRes.total || 0
    stats.value.stations = sRes.total || 0
    stats.value.devices = dRes.total || 0
    stats.value.alarms = aRes.total || 0

    const zones = (zRes.rows || []).filter(z => z.longitude && z.latitude)
    const stations = (sRes.rows || []).filter(s => s.longitude && s.latitude)
    const devices = (dRes.rows || []).filter(d => d.longitude && d.latitude)
    const alarms = (aRes.rows || [])

    renderZones(zones)
    renderStations(stations)
    renderDevices(devices)
    renderAlarms(alarms, devices)
  } catch (e) {
    console.warn('数据加载失败', e)
  }
}

// ============ 渲染分区 ============
function renderZones(zones) {
  clearCluster(zoneCluster)
  if (zones.length === 0) return

  zoneCluster = new window.AMap.MarkerCluster(map, zones.map(z => {
    return createMarker(
      [Number(z.longitude), Number(z.latitude)],
      z.name || z.code,
      '#8B5CF6', 18, 'zone'
    )
  }), { gridSize: 100, maxZoom: 14 })
}

// ============ 渲染站点 ============
function renderStations(stations) {
  clearCluster(stationCluster)
  if (stations.length === 0) return

  stationCluster = new window.AMap.MarkerCluster(map, stations.map(s => {
    const status = s.iotStatus || '0'
    const color = status === '3' ? '#EF4444' : status === '2' ? '#F59E0B' : '#3B82F6'
    return createMarker([Number(s.longitude), Number(s.latitude)], s.name || s.code, color, 16, 'station')
  }), { gridSize: 80, maxZoom: 15 })
}

// ============ 渲染设备 ============
function renderDevices(devices) {
  clearCluster(deviceCluster)
  if (devices.length === 0) return

  deviceCluster = new window.AMap.MarkerCluster(map, devices.map(d => {
    const status = d.iotStatus || '0'
    const color = status === '3' ? '#EF4444' : status === '2' ? '#F59E0B' : '#10B981'
    return createMarker([Number(d.longitude), Number(d.latitude)], d.name || d.code, color, 12, 'device')
  }), { gridSize: 60, maxZoom: 17 })
}

// ============ 渲染报警 ============
function renderAlarms(alarms, devices) {
  clearAlarmMarkers()

  alarms.forEach(a => {
    // 找到报警对应的设备位置
    const device = devices.find(d => d.code === a.alarmSource || d.name === a.alarmSource)
    if (!device || !device.longitude || !device.latitude) return

    const marker = new window.AMap.Marker({
      position: [Number(device.longitude), Number(device.latitude)],
      offset: new window.AMap.Pixel(-10, -10),
      zIndex: 100,
    })
    marker.setContent(`
      <div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;width:20px;height:20px;border-radius:50%;background:rgba(239,68,68,0.3);animation:pulse 1.5s ease-out infinite"></div>
        <div style="width:10px;height:10px;border-radius:50%;background:#EF4444;border:2px solid #fff;z-index:1"></div>
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
  m.setContent(`<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 8px ${color};opacity:0.9"></div>`)
  m.on('click', () => {
    map.setZoomAndCenter(15, pos)
  })
  return m
}

function clearCluster(cluster) {
  if (cluster) { cluster.setMap(null) }
}

function clearAlarmMarkers() {
  alarmMarkers.forEach(m => map && map.remove(m))
  alarmMarkers = []
}

function toggleLayer(type) {
  layers.value[type] = !layers.value[type]
  if (type === 'device') {
    layers.value.device ? deviceCluster && deviceCluster.setMap(map) : deviceCluster && deviceCluster.setMap(null)
  } else if (type === 'zone') {
    layers.value.zone ? zoneCluster && zoneCluster.setMap(map) : zoneCluster && zoneCluster.setMap(null)
  } else if (type === 'station') {
    layers.value.station ? stationCluster && stationCluster.setMap(map) : stationCluster && stationCluster.setMap(null)
  } else if (type === 'alarm') {
    layers.value.alarm ? alarmMarkers.forEach(m => map && map.add(m)) : alarmMarkers.forEach(m => map && map.remove(m))
  }
}

onMounted(() => { initMap() })

onBeforeUnmount(() => {
  clearCluster(deviceCluster)
  clearCluster(stationCluster)
  clearCluster(zoneCluster)
  clearAlarmMarkers()
  if (map) { map.destroy(); map = null }
})
</script>

<style lang="scss" scoped>
.gis-screen {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 200;
  background: #0F172A;
  &.light { background: #F8FAFC; }
}

.map-area {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  min-width: 100vw; min-height: 100vh;
}

.top-bar {
  position: absolute; top: 0; left: 0; right: 0; z-index: 10;
  display: flex; align-items: center; gap: 16px;
  padding: 14px 24px;
  background: linear-gradient(180deg, rgba(15,23,42,0.95), rgba(15,23,42,0));
  pointer-events: none;
  .back-btn { pointer-events: auto; font-size: 20px; color: #94A3B8; cursor: pointer; &:hover { color: #5EEAD4; } }
  .title { font-size: 18px; font-weight: 700; color: #E2E8F0; }
  .subtitle { font-size: 13px; color: #64748B; margin-left: auto; }
}

.light .top-bar {
  background: linear-gradient(180deg, rgba(248,250,252,0.95), rgba(248,250,252,0));
  .back-btn { color: #64748B; &:hover { color: #0D9488; } }
  .title { color: #0F172A; }
  .subtitle { color: #94A3B8; }
}

.legend-bar {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 10;
  display: flex; gap: 20px; padding: 8px 20px;
  background: rgba(15,23,42,0.85); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);
}

.legend-item {
  display: flex; align-items: center; gap: 6px; font-size: 12px; color: #94A3B8;
  cursor: pointer; padding: 4px 8px; border-radius: 12px; transition: all 0.2s;
  &.active { color: #5EEAD4; background: rgba(13,148,136,0.2); }
  .dot { width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid #fff;
    &.zone { background: #8B5CF6; }
    &.device { background: #10B981; }
    &.station { background: #3B82F6; }
    &.alarm { background: #EF4444; }
  }
}

.light .legend-bar {
  background: rgba(255,255,255,0.9); border-color: #E2E8F0;
}
.light .legend-item {
  color: #64748B;
  &.active { color: #0D9488; background: rgba(13,148,136,0.1); }
}

.loading-mask {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 100;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  background: rgba(15,23,42,0.9); color: #94A3B8; font-size: 14px;
  .loading-icon { animation: spin 1s linear infinite; }
}
.light .loading-mask { background: rgba(248,250,252,0.9); color: #64748B; }

.no-key-mask {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  background: rgba(15,23,42,0.95);
}
.no-key-card {
  text-align: center; color: #CBD5E1; max-width: 420px; padding: 40px;
  h3 { color: #E2E8F0; margin: 16px 0 8px; font-size: 18px; }
  p { color: #64748B; font-size: 14px; margin: 0 0 24px; }
  .el-icon { color: #F59E0B; }
}
.light .no-key-mask { background: rgba(248,250,252,0.95); }
.light .no-key-card { h3 { color: #0F172A; } p { color: #64748B; } }

@keyframes spin { to { transform: rotate(360deg); } }
</style>

<style>
.amap-logo, .amap-copyright { display: none !important; }
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
}
</style>
