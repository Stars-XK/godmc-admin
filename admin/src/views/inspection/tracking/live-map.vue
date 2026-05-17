<template>
  <div class="live-map-container">
    <!-- 地图区域 -->
    <div ref="mapContainer" class="map-area"></div>

    <!-- 顶部工具栏 -->
    <div class="top-toolbar">
      <span class="toolbar-title">实时追踪</span>
      <el-tag :type="wsConnected ? 'success' : 'danger'" size="small" class="conn-tag">
        {{ wsConnected ? 'WS已连接' : 'WS断开' }}
      </el-tag>
      <span class="online-count">{{ liveInspectors.length }} 人在线</span>
    </div>

    <!-- 左侧巡检员列表 -->
    <div class="left-panel">
      <div class="panel-header">在线巡检员</div>
      <div class="inspector-list">
        <div
          v-for="insp in liveInspectors"
          :key="insp.userId"
          class="inspector-item"
          :class="{ active: selectedUserId === insp.userId }"
          @click="selectInspector(insp)"
        >
          <span class="insp-dot" :style="{ background: inspectorColor(insp.userId) }"></span>
          <div class="insp-info">
            <span class="insp-name">{{ insp.userName }}</span>
            <span class="insp-task">任务 #{{ insp.taskId }}</span>
          </div>
          <span class="insp-time">{{ fmtTime(insp.updatedAt) }}</span>
        </div>
        <div v-if="!liveInspectors.length" class="empty-hint">暂无在线巡检员</div>
      </div>
      <div class="panel-footer" v-if="selectedInspector">
        <el-button size="small" @click="loadTrail">查看轨迹</el-button>
        <el-button size="small" @click="clearTrail">清除轨迹</el-button>
      </div>
    </div>

    <!-- 右侧告警面板 -->
    <div class="right-panel">
      <div class="panel-header">
        电子围栏告警
        <el-badge v-if="alerts.length" :value="alerts.length" class="alert-badge" />
      </div>
      <div class="alert-list">
        <div v-for="(a, i) in alerts" :key="i" class="alert-item">
          <span class="alert-icon">⚠</span>
          <div class="alert-info">
            <span class="alert-user">{{ a.userName }}</span>
            <span class="alert-desc">偏离{{ a.distance }}m · {{ a.routeName }}</span>
            <span class="alert-time">{{ fmtTime(a.timestamp) }}</span>
          </div>
        </div>
        <div v-if="!alerts.length" class="empty-hint">暂无告警</div>
      </div>
    </div>

    <!-- 轨迹回放控制 -->
    <div class="replay-bar" v-if="trailVisible">
      <span>轨迹点: {{ trailPoints.length }}</span>
      <el-date-picker
        v-model="trailTimeRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始"
        end-placeholder="结束"
        size="small"
        @change="loadTrail"
      />
      <el-button size="small" @click="clearTrail">关闭</el-button>
    </div>

    <!-- 加载 -->
    <div v-if="!mapReady" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载地图中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { io } from 'socket.io-client'
import { useAMap } from '@/hooks/useAMap'
import { getLivePositions, getTrail } from '@/api/inspection/tracking'

const WS_URL = (import.meta.env.VITE_APP_WS_URL) || 'http://localhost:3009'
const MAP_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']

const mapContainer = ref(null)
const mapReady = ref(false)
const wsConnected = ref(false)
const selectedUserId = ref(null)
const selectedInspector = ref(null)
const liveInspectors = ref([])
const alerts = ref([])
const trailVisible = ref(false)
const trailPoints = ref([])
const trailTimeRange = ref([])

let socket = null
let AMapNS = null
let mapInstance = null
let inspectorMarkers = new Map()
let trailLine = null
let geofenceCircles = []

const { map, loaded, AMap: amapRef, init, destroy } = useAMap({
  plugins: ['AMap.Polyline', 'AMap.Circle', 'AMap.Marker', 'AMap.InfoWindow'],
})

function inspectorColor(userId) {
  return MAP_COLORS[userId % MAP_COLORS.length]
}

function fmtTime(d) {
  if (!d) return ''
  const t = new Date(d)
  return t.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// WebSocket 连接
function connectWS() {
  socket = io(`${WS_URL}/ws/inspection`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  })

  socket.on('connect', () => { wsConnected.value = true })
  socket.on('disconnect', () => { wsConnected.value = false })

  socket.on('inspection:location:update', (data) => {
    updateInspectorPosition(data)
  })

  socket.on('inspection:geofence:alert', (data) => {
    alerts.value.unshift(data)
    if (alerts.value.length > 20) alerts.value.length = 20
  })
}

// 更新巡检员位置
function updateInspectorPosition(data) {
  const { userId, lng, lat } = data
  const existing = liveInspectors.value.find(i => i.userId === userId)
  if (existing) {
    Object.assign(existing, data)
  } else {
    liveInspectors.value.unshift(data)
  }
  updateMarker(data)
}

// 更新地图标记
function updateMarker(data) {
  if (!AMapNS || !mapInstance) return
  let marker = inspectorMarkers.get(data.userId)
  const color = inspectorColor(data.userId)
  const pos = [data.lng, data.lat]

  if (marker) {
    marker.setPosition(pos)
  } else {
    marker = new AMapNS.Marker({
      position: pos,
      icon: new AMapNS.Icon({
        size: new AMapNS.Size(24, 24),
        imageSize: new AMapNS.Size(24, 24),
        image: createCircleSVG(color),
      }),
      label: {
        content: `<span style="color:#333;font-size:11px;background:rgba(255,255,255,.85);padding:1px 4px;border-radius:3px">${data.userName || ''}</span>`,
        direction: 'top',
        offset: new AMapNS.Pixel(0, -28),
      },
      zIndex: 100,
    })
    marker.on('click', () => selectInspector(data))
    mapInstance.add(marker)
    inspectorMarkers.set(data.userId, marker)
  }
}

function createCircleSVG(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="12" cy="12" r="4" fill="#fff"/>
  </svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

// 选择巡检员
function selectInspector(insp) {
  selectedUserId.value = insp.userId
  selectedInspector.value = insp
  if (mapInstance) {
    mapInstance.setCenter([insp.lng, insp.lat])
    mapInstance.setZoom(16)
  }
}

// 加载轨迹
async function loadTrail() {
  if (!selectedInspector.value || !AMapNS) return
  const { taskId } = selectedInspector.value
  const params = {}
  if (trailTimeRange.value?.length === 2) {
    params.start = trailTimeRange.value[0].toISOString()
    params.end = trailTimeRange.value[1].toISOString()
  }
  try {
    const res = await getTrail(taskId, params)
    const points = (res.data || []).map(p => [Number(p.lng), Number(p.lat)])
    trailPoints.value = points.map((p, i) => ({ lng: p[0], lat: p[1], index: i }))

    if (trailLine) mapInstance.remove(trailLine)
    if (points.length > 1) {
      trailLine = new AMapNS.Polyline({
        path: points,
        strokeColor: '#3B82F6',
        strokeWeight: 4,
        strokeOpacity: 0.7,
        showDir: true,
      })
      mapInstance.add(trailLine)
      mapInstance.setFitView([trailLine])
    }
    trailVisible.value = true
  } catch (e) {
    console.error('加载轨迹失败', e)
  }
}

function clearTrail() {
  if (trailLine) { mapInstance.remove(trailLine); trailLine = null }
  trailPoints.value = []
  trailVisible.value = false
}

// 初始加载在线位置
async function loadInitialPositions() {
  try {
    const res = await getLivePositions()
    const list = res.data || []
    list.forEach(p => updateInspectorPosition(p))
  } catch (e) { /* silent */ }
}

onMounted(async () => {
  await nextTick()
  const inst = await init(mapContainer.value)
  if (!inst) { mapReady.value = true; return }
  mapInstance = inst
  AMapNS = amapRef.value
  mapReady.value = true
  connectWS()
  loadInitialPositions()
  // 定时刷新（兜底）
  const timer = setInterval(loadInitialPositions, 30000)
  onBeforeUnmount(() => clearInterval(timer))
})

onBeforeUnmount(() => {
  if (socket) socket.disconnect()
  destroy?.()
})
</script>

<style scoped>
.live-map-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 84px);
  overflow: hidden;
  background: #1a1a2e;
}
.map-area {
  width: 100%;
  height: 100%;
}

/* 顶部工具栏 */
.top-toolbar {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 8px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  z-index: 100;
}
.toolbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}
.conn-tag { margin-left: 4px; }
.online-count {
  font-size: 13px;
  color: #6b7280;
}

/* 左侧面板 */
.left-panel {
  position: absolute;
  left: 12px;
  top: 80px;
  width: 240px;
  max-height: calc(100% - 160px);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}
.inspector-list { flex: 1; overflow-y: auto; padding: 6px 0; }
.inspector-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.inspector-item:hover { background: #f3f4f6; }
.inspector-item.active { background: #eff6ff; }
.insp-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.insp-info { flex: 1; min-width: 0; }
.insp-name { display: block; font-size: 13px; color: #1f2937; }
.insp-task { font-size: 11px; color: #9ca3af; }
.insp-time { font-size: 11px; color: #9ca3af; white-space: nowrap; }
.empty-hint { padding: 16px; text-align: center; color: #9ca3af; font-size: 13px; }
.panel-footer { padding: 8px 14px; border-top: 1px solid #e5e7eb; display: flex; gap: 6px; }

/* 右侧告警面板 */
.right-panel {
  position: absolute;
  right: 12px;
  top: 80px;
  width: 260px;
  max-height: calc(100% - 160px);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.alert-badge { margin-left: 8px; }
.alert-list { flex: 1; overflow-y: auto; padding: 6px 0; }
.alert-item {
  display: flex;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid #fef2f2;
  align-items: flex-start;
}
.alert-icon { color: #ef4444; font-size: 16px; flex-shrink: 0; margin-top: 1px; }
.alert-info { flex: 1; min-width: 0; }
.alert-user { display: block; font-size: 13px; color: #1f2937; font-weight: 500; }
.alert-desc { display: block; font-size: 12px; color: #ef4444; margin-top: 2px; }
.alert-time { font-size: 11px; color: #9ca3af; display: block; margin-top: 2px; }

/* 轨迹回放 */
.replay-bar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 8px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  z-index: 100;
  font-size: 13px;
  color: #374151;
}

/* 加载 */
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 46, 0.9);
  z-index: 200;
  color: #fff;
}
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

<style>
html.dark-mode .live-map-container {
  background: #0F172A !important;
}
html.dark-mode .top-toolbar,
html.dark-mode .left-panel,
html.dark-mode .right-panel,
html.dark-mode .replay-bar {
  background: rgba(30, 41, 59, 0.94) !important;
  color: #CBD5E1 !important;
}
html.dark-mode .toolbar-title,
html.dark-mode .panel-header {
  color: #E2E8F0 !important;
}
html.dark-mode .insp-name,
html.dark-mode .alert-user {
  color: #E2E8F0 !important;
}
html.dark-mode .insp-task,
html.dark-mode .insp-time,
html.dark-mode .alert-time {
  color: #94A3B8 !important;
}
html.dark-mode .inspector-item:hover {
  background: #334155 !important;
}
html.dark-mode .inspector-item.active {
  background: rgba(13, 148, 136, 0.18) !important;
}
html.dark-mode .panel-header {
  border-bottom-color: #334155 !important;
}
html.dark-mode .panel-footer {
  border-top-color: #334155 !important;
}
html.dark-mode .alert-item {
  border-bottom-color: #334155 !important;
}
html.dark-mode .empty-hint {
  color: #64748B !important;
}
html.dark-mode .loading-overlay {
  background: rgba(15, 23, 42, 0.95) !important;
}
</style>
