<template>
  <div class="burst-page">
    <!-- ====== 左侧面板 ====== -->
    <div class="glass-panel left-panel">
      <div class="panel-header">
        <el-icon :size="18"><Warning /></el-icon>
        <span>分区风险</span>
        <el-button size="small" type="primary" link @click="analyzeAll" :loading="analyzingAll">
          一键分析
        </el-button>
      </div>

      <div class="zone-list">
        <div
          class="zone-row"
          v-for="z in riskZones"
          :key="z.zoneCode"
          :class="{ active: selectedZone === z.zoneCode, ['risk-' + z.riskLevel]: true }"
          @click="selectZone(z)"
        >
          <span class="risk-dot" :class="z.riskLevel"></span>
          <span class="zone-name">{{ z.zoneName || z.zoneCode }}</span>
          <span class="zone-badge" v-if="z.eventCount > 0">{{ z.eventCount }}</span>
          <el-icon v-if="z.riskLevel === 'high'" class="risk-icon" color="#EF4444"><WarningFilled /></el-icon>
        </div>
        <div v-if="riskZones.length === 0" class="empty-hint">暂无数据，请先执行分析</div>
      </div>

      <div class="panel-divider"></div>

      <div class="history-section" v-if="selectedZone">
        <div class="section-title">历史事件</div>
        <div class="history-list">
          <div class="history-row" v-for="e in historyEvents" :key="e.id" @click="selectEvent(e)">
            <span class="h-time">{{ fmtTime(e.anomalyTime) }}</span>
            <span class="h-type">{{ burstTypeLabel(e.burstType) }}</span>
            <span class="h-conf" :style="{ color: confColor(e.confidence) }">{{ e.confidence }}%</span>
          </div>
          <div v-if="historyEvents.length === 0" class="empty-hint">暂无历史记录</div>
        </div>
      </div>
    </div>

    <!-- ====== 中央地图 ====== -->
    <div class="map-container">
      <div ref="mapRef" class="map-area"></div>

      <!-- 地图浮动标签 -->
      <div class="map-label" v-if="selectedEvent">
        <span class="label-tag" :class="'sev-' + selectedEvent.severity">
          {{ severityLabel(selectedEvent.severity) }}
        </span>
        {{ selectedEvent.description?.substring(0, 40) }}...
      </div>

      <div v-if="mapLoading" class="map-loading">
        <el-icon class="spin-icon" :size="28"><Loading /></el-icon>
      </div>
    </div>

    <!-- ====== 右侧面板 ====== -->
    <div class="glass-panel right-panel">
      <!-- 分析结果 -->
      <div v-if="selectedEvent" class="detail-section">
        <div class="panel-header">事件详情 #{{ selectedEvent.id }}</div>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="d-label">爆管类型</span>
            <span class="d-value">{{ burstTypeLabel(selectedEvent.burstType) }}</span>
          </div>
          <div class="detail-item">
            <span class="d-label">置信度</span>
            <span class="d-value" :style="{ color: confColor(selectedEvent.confidence), fontSize: '22px', fontWeight: 700 }">
              {{ selectedEvent.confidence }}%
            </span>
          </div>
          <div class="detail-item">
            <span class="d-label">严重等级</span>
            <span class="d-value">{{ severityLabel(selectedEvent.severity) }}</span>
          </div>
          <div class="detail-item">
            <span class="d-label">异常时间</span>
            <span class="d-value">{{ fmtTime(selectedEvent.anomalyTime) }}</span>
          </div>
          <div class="detail-item" v-if="selectedEvent.flowBefore">
            <span class="d-label">异常前流量</span>
            <span class="d-value">{{ selectedEvent.flowBefore }} m³/h</span>
          </div>
          <div class="detail-item" v-if="selectedEvent.flowAfter">
            <span class="d-label">异常后流量</span>
            <span class="d-value">{{ selectedEvent.flowAfter }} m³/h</span>
          </div>
          <div class="detail-item" v-if="selectedEvent.pressureBefore">
            <span class="d-label">异常前压力</span>
            <span class="d-value">{{ selectedEvent.pressureBefore }} MPa</span>
          </div>
          <div class="detail-item" v-if="selectedEvent.pressureAfter">
            <span class="d-label">异常后压力</span>
            <span class="d-value">{{ selectedEvent.pressureAfter }} MPa</span>
          </div>
        </div>

        <div class="panel-divider"></div>
        <div class="desc-text">{{ selectedEvent.description }}</div>

        <div class="panel-divider"></div>

        <!-- 影响面信息 -->
        <div v-if="burstArea" class="area-info">
          <div class="section-title">影响面</div>
          <div class="detail-grid small">
            <div class="detail-item">
              <span class="d-label">影响面积</span>
              <span class="d-value">{{ (burstArea.areaSize / 10000).toFixed(2) }} 公顷</span>
            </div>
            <div class="detail-item">
              <span class="d-label">受影响管线</span>
              <span class="d-value">{{ burstArea.affectedPipeCount }} 条</span>
            </div>
            <div class="detail-item">
              <span class="d-label">受影响设备</span>
              <span class="d-value">{{ burstArea.affectedDeviceCount }} 台</span>
            </div>
            <div class="detail-item">
              <span class="d-label">预估水损失</span>
              <span class="d-value" style="color:#EF4444">{{ burstArea.estimatedWaterLoss }} m³/h</span>
            </div>
          </div>
        </div>

        <div class="panel-divider"></div>

        <!-- 操作按钮 -->
        <div class="action-row">
          <el-button type="success" size="small" @click="confirmEvent" :disabled="selectedEvent.status !== '0'">
            <el-icon><Check /></el-icon> 确认
          </el-button>
          <el-button type="warning" size="small" @click="falseAlarm" :disabled="selectedEvent.status !== '0'">
            <el-icon><Close /></el-icon> 误报
          </el-button>
          <el-button type="primary" size="small" @click="markFixed" :disabled="selectedEvent.status !== '1'">
            <el-icon><CircleCheck /></el-icon> 已修复
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-icon :size="48" color="#64748B"><Search /></el-icon>
        <p>选择左侧分区执行爆管分析<br/>或点击历史事件查看详情</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  Warning, WarningFilled, Loading, Search, Check, Close, CircleCheck
} from '@element-plus/icons-vue'
import {
  getRiskZones, analyzeZone, analyzeAllZones, listBurstEvents,
  getBurstEvent, updateBurstEventStatus, getBurstArea, getBurstHistory
} from '@/api/water-basic/burst'
import { getConfigKey } from '@/api/system/config'
import request from '@/utils/request'
import AMapLoader from '@amap/amap-jsapi-loader'

const analyzingAll = ref(false)
const selectedZone = ref('')
const riskZones = ref([])
const historyEvents = ref([])
const selectedEvent = ref(null)
const burstArea = ref(null)
const mapLoading = ref(false)

// ============ 地图 ============
const mapRef = ref(null)
let map = null
let pipeLines = []
let areaPolygon = null
let burstMarker = null

// ============ 分区选择 ============
async function selectZone(z) {
  selectedZone.value = z.zoneCode
  mapLoading.value = true
  selectedEvent.value = null
  burstArea.value = null

  try {
    // 加载该分区历史
    const hRes = await getBurstHistory(z.zoneCode)
    historyEvents.value = hRes.data || []

    // 加载分区管线到地图
    await loadZonePipes(z.zoneCode)

    // 如果有历史事件，默认选中第一个
    if (historyEvents.value.length > 0) {
      await selectEvent(historyEvents.value[0])
    }
  } finally {
    mapLoading.value = false
  }
}

// ============ 事件选择 ============
async function selectEvent(event) {
  selectedEvent.value = event
  burstArea.value = null

  // 加载影响面
  try {
    const res = await getBurstArea(event.id)
    if (res.data) burstArea.value = res.data
  } catch {}

  // 地图标注
  await renderBurstOnMap(event)
}

async function renderBurstOnMap(event) {
  if (!map || !window.AMap) return

  // 清除旧标注
  if (areaPolygon) { map.remove(areaPolygon); areaPolygon = null }
  if (burstMarker) { map.remove(burstMarker); burstMarker = null }

  // 绘制影响面
  try {
    const res = await getBurstArea(event.id)
    const geojson = res.data?.geojson
    if (geojson && geojson.geometry) {
      const coords = geojson.geometry.coordinates[0]
      const path = coords.map(c => [c[0], c[1]])
      areaPolygon = new window.AMap.Polygon({
        path,
        fillColor: 'rgba(239,68,68,0.2)',
        strokeColor: '#EF4444',
        strokeWeight: 2,
        strokeStyle: 'dashed',
        zIndex: 10,
      })
      map.add(areaPolygon)
      map.setFitView([areaPolygon])
    }
  } catch {}

  // 标记爆管位置
  if (geojson?.properties?.center) {
    const [lng, lat] = geojson.properties.center
    burstMarker = new window.AMap.Marker({
      position: [lng, lat],
      offset: new window.AMap.Pixel(-16, -16),
      zIndex: 100,
    })
    burstMarker.setContent(`
      <div class="burst-marker">
        <div class="burst-ripple"></div>
        <div class="burst-core"></div>
      </div>`)
    map.add(burstMarker)
    map.setZoomAndCenter(14, [lng, lat])
  }
}

// ============ 管线加载 ============
async function loadZonePipes(zoneCode) {
  // 清除旧管线
  pipeLines.forEach(l => map && map.remove(l))
  pipeLines = []

  try {
    // 获取分区管线（通过 GIS layers 接口）
    const res = await request({ url: '/gis/layers', method: 'get' })
    const zones = res.data?.zones?.rows || []
    const devices = res.data?.devices?.rows || []
    const stations = res.data?.stations?.rows || []

    // 绘制设备标记
    const zoneDevices = devices.filter(d => d.zoneCode === zoneCode)
    if (zoneDevices.length > 0 && window.AMap) {
      zoneDevices.forEach(d => {
        if (d.longitude && d.latitude) {
          const m = new window.AMap.Marker({
            position: [Number(d.longitude), Number(d.latitude)],
            offset: new window.AMap.Pixel(-6, -6),
          })
          m.setContent(`<div style="width:12px;height:12px;border-radius:50%;background:#60A5FA;border:2px solid #fff;"></div>`)
          m.setTitle(d.name || d.code)
          map.add(m)
          pipeLines.push(m)
        }
      })
    }

    // 绘制站点标记
    const zoneStations = stations.filter(s => s.zoneCode === zoneCode)
    if (zoneStations.length > 0 && window.AMap) {
      zoneStations.forEach(s => {
        if (s.longitude && s.latitude) {
          const m = new window.AMap.Marker({
            position: [Number(s.longitude), Number(s.latitude)],
            offset: new window.AMap.Pixel(-8, -8),
          })
          m.setContent(`<div style="width:16px;height:16px;border-radius:4px;background:#34D399;border:2px solid #fff;"></div>`)
          m.setTitle(s.name || s.code)
          map.add(m)
          pipeLines.push(m)
        }
      })
    }

    if (zoneDevices.length > 0 || zoneStations.length > 0) {
      const allPoints = [
        ...zoneDevices.filter(d => d.longitude && d.latitude).map(d => [Number(d.longitude), Number(d.latitude)]),
        ...zoneStations.filter(s => s.longitude && s.latitude).map(s => [Number(s.longitude), Number(s.latitude)]),
      ]
      if (allPoints.length > 0) {
        map.setFitView(allPoints)
      }
    }
  } catch (e) {
    console.warn('加载管线失败', e)
  }
}

// ============ 分析操作 ============
async function analyzeAll() {
  analyzingAll.value = true
  try {
    const res = await analyzeAllZones()
    if (res.code === 200) {
      // 刷新风险分区列表
      await loadRiskZones()
    }
  } finally {
    analyzingAll.value = false
  }
}

async function loadRiskZones() {
  try {
    const res = await getRiskZones()
    riskZones.value = res.data || []
  } catch {}
}

async function confirmEvent() {
  await updateBurstEventStatus(selectedEvent.value.id, '1')
  selectedEvent.value.status = '1'
}

async function falseAlarm() {
  await updateBurstEventStatus(selectedEvent.value.id, '2')
  selectedEvent.value.status = '2'
}

async function markFixed() {
  await updateBurstEventStatus(selectedEvent.value.id, '3')
  selectedEvent.value.status = '3'
}

// ============ 地图初始化 ============
async function initMap() {
  let amapKey = ''
  try {
    const res = await getConfigKey('gis.map.amap.key')
    if (res?.data) amapKey = res.data
  } catch {}

  if (!amapKey) return

  try {
    const AMap = await AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.Polygon', 'AMap.Marker']
    })
    window.AMap = AMap

    await nextTick()
    map = new AMap.Map(mapRef.value, {
      zoom: 12,
      center: [118.6, 24.9],
      viewMode: '2D',
      resizeEnable: true,
    })
  } catch (e) {
    console.error('地图加载失败', e)
  }
}

// ============ 辅助 ============
function burstTypeLabel(t) {
  if (!t) return '--'
  const labels = { FLOW_DROP: '流量突变', PRESSURE_DROP: '压力突降', SUPPLY_DIFF: '产销差异常' }
  return t.split(',').map(x => labels[x] || x).join(', ')
}

function severityLabel(s) {
  const labels = { 1: '低', 2: '中', 3: '高', 4: '严重' }
  return labels[s] || s
}

function confColor(c) {
  if (c >= 70) return '#EF4444'
  if (c >= 50) return '#F59E0B'
  return '#3B82F6'
}

function fmtTime(t) {
  if (!t) return '--'
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(async () => {
  await initMap()
  await loadRiskZones()
})

onBeforeUnmount(() => {
  pipeLines.forEach(l => map && map.remove(l))
  if (areaPolygon) map.remove(areaPolygon)
  if (burstMarker) map.remove(burstMarker)
  if (map) { map.destroy(); map = null }
})
</script>

<style lang="scss" scoped>
.burst-page {
  display: flex; height: calc(100vh - 84px);
  background: #0F172A; color: #CBD5E1; gap: 0;
  overflow: hidden;
}

/* ========== 玻璃面板 ========== */
.glass-panel {
  background: rgba(15, 23, 42, 0.9);
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.left-panel  { width: 300px; flex-shrink: 0; }
.right-panel { width: 340px; flex-shrink: 0; border-right: none; border-left: 1px solid rgba(255,255,255,0.06); }

.panel-header {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 16px; font-size: 14px; font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.panel-divider { border-top: 1px solid rgba(255,255,255,0.05); margin: 8px 0; }

/* ========== 分区列表 ========== */
.zone-list { flex: 1; overflow-y: auto; padding: 4px; }
.zone-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px; cursor: pointer;
  transition: background 0.15s; margin: 2px 0;
  &:hover { background: rgba(255,255,255,0.04); }
  &.active { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.25); }
}
.risk-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  &.high   { background: #EF4444; box-shadow: 0 0 6px #EF4444; }
  &.medium { background: #F59E0B; box-shadow: 0 0 6px #F59E0B; }
  &.low    { background: #10B981; }
}
.zone-name { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.zone-badge {
  font-size: 11px; padding: 1px 7px; border-radius: 10px;
  background: rgba(239,68,68,0.2); color: #F87171; font-weight: 600;
}
.empty-hint { text-align: center; padding: 24px; font-size: 13px; color: #64748B; }

/* ========== 历史列表 ========== */
.history-section { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.section-title { font-size: 12px; color: #64748B; padding: 8px 16px 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
.history-list { overflow-y: auto; flex: 1; padding: 0 4px; }
.history-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 6px; cursor: pointer;
  font-size: 12px; transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.04); }
}
.h-time { color: #64748B; flex-shrink: 0; }
.h-type { flex: 1; color: #94A3B8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.h-conf { font-weight: 700; flex-shrink: 0; }

/* ========== 地图 ========== */
.map-container { flex: 1; position: relative; }
.map-area { width: 100%; height: 100%; }
.map-label {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  padding: 8px 16px; border-radius: 20px;
  background: rgba(15,23,42,0.85); backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1); font-size: 13px;
  display: flex; align-items: center; gap: 8px; z-index: 10;
}
.label-tag {
  padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff;
  &.sev-1 { background: #3B82F6; }
  &.sev-2 { background: #F59E0B; }
  &.sev-3 { background: #EF4444; }
  &.sev-4 { background: #7C3AED; }
}
.map-loading {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(15,23,42,0.6);
}
.spin-icon { animation: spin 1s linear infinite; color: #5EEAD4; }

/* ========== 详情 ========== */
.detail-section { padding: 8px 16px; overflow-y: auto; flex: 1; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  &.small { grid-template-columns: 1fr 1fr; }
}
.detail-item { padding: 4px 0; }
.d-label { font-size: 11px; color: #64748B; display: block; }
.d-value { font-size: 14px; color: #CBD5E1; display: block; margin-top: 2px; }
.desc-text { font-size: 13px; color: #94A3B8; line-height: 1.5; padding: 4px 0; }
.area-info { padding: 4px 0; }

/* ========== 操作按钮 ========== */
.action-row { display: flex; gap: 8px; padding: 8px 0; }

/* ========== 空状态 ========== */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  flex: 1; gap: 12px; color: #64748B; text-align: center; padding: 40px;
  p { font-size: 13px; line-height: 1.6; }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>

<style>
.burst-marker {
  position: relative; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
}
.burst-marker .burst-ripple {
  position: absolute; width: 32px; height: 32px; border-radius: 50%;
  background: rgba(239,68,68,0.25);
  animation: burstRipple 2s ease-out infinite;
}
.burst-marker .burst-core {
  width: 16px; height: 16px; border-radius: 50%;
  background: #EF4444; border: 3px solid #fff; z-index: 1; position: relative;
}
@keyframes burstRipple {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
}
.amap-logo, .amap-copyright { display: none !important; }
</style>
