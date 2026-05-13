<template>
  <div class="overview-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <div class="stat-card stat-station">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">接入站点</div>
              <div class="stat-value">{{ stats.stationCount }}</div>
            </div>
            <div class="stat-icon-box"><el-icon :size="26"><OfficeBuilding /></el-icon></div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-device">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">监测设备</div>
              <div class="stat-value">{{ stats.deviceCount }}</div>
            </div>
            <div class="stat-icon-box"><el-icon :size="26"><Cpu /></el-icon></div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-point">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">感知测点</div>
              <div class="stat-value">{{ stats.pointCount }}</div>
            </div>
            <div class="stat-icon-box"><el-icon :size="26"><Odometer /></el-icon></div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-pipe">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">管网管线</div>
              <div class="stat-value">{{ stats.pipeCount }}</div>
            </div>
            <div class="stat-icon-box"><el-icon :size="26"><Share /></el-icon></div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 主内容区 -->
    <el-row :gutter="16" class="main-row">
      <!-- 左侧：可展开的站点列表（分页 + 懒加载子节点） -->
      <el-col :span="7" class="left-col">
        <el-card class="list-panel" shadow="never">
          <template #header>
            <div class="panel-header">
              <span class="header-title"><span class="title-dot"></span>物联拓扑</span>
              <el-tag size="small" effect="light" round>{{ total }} 站点</el-tag>
            </div>
            <div class="tree-search">
              <el-input
                v-model="queryParams.name"
                placeholder="搜索站点名称..."
                prefix-icon="Search"
                clearable
                size="small"
                @keyup.enter="handleSearch"
                @clear="handleSearch"
              />
            </div>
          </template>
          <div class="list-body" v-loading="loading">
            <el-scrollbar v-if="stationList.length > 0">
              <div
                v-for="station in stationList"
                :key="station.id"
                class="tree-node-list"
              >
                <!-- 站点行 -->
                <div
                  class="node-row node-station"
                  :class="{ 'is-active': selectedNode && selectedNode.code === station.code && selectedNode.nodeType === 'station' }"
                  @click="selectStation(station)"
                >
                  <span class="expand-icon" @click.stop="toggleExpand('station', station)">
                    <el-icon :size="12">
                      <ArrowRight v-if="!expandedMap[`station-${station.code}`]" />
                      <ArrowDown v-else />
                    </el-icon>
                  </span>
                  <span class="node-icon-box icon-station"><el-icon :size="14"><OfficeBuilding /></el-icon></span>
                  <span class="node-label" :title="station.name">{{ station.name }}</span>
                  <span class="node-status" :class="statusClass(station)"></span>
                  <span class="node-badge badge-devices">{{ station._deviceCount || 0 }}</span>
                </div>

                <!-- 设备子列表（懒加载） -->
                <template v-if="expandedMap[`station-${station.code}`]">
                  <div v-loading="station._loadingDevices" style="min-height: 24px">
                    <template v-for="device in (station._devices || [])" :key="device.id">
                      <div
                        class="node-row node-device"
                        :class="{ 'is-active': selectedNode && selectedNode.code === device.code && selectedNode.nodeType === 'device' }"
                        @click="selectDevice(device, station)"
                      >
                        <span class="expand-indent" style="width: 20px"></span>
                        <span class="expand-icon" @click.stop="toggleExpand('device', device, station)">
                          <el-icon :size="12">
                            <ArrowRight v-if="!expandedMap[`device-${device.code}`]" />
                            <ArrowDown v-else />
                          </el-icon>
                        </span>
                        <span class="node-icon-box icon-device"><el-icon :size="14"><Cpu /></el-icon></span>
                        <span class="node-label" :title="device.name">{{ device.name }}</span>
                        <span class="node-status" :class="statusClass(device)"></span>
                        <span class="node-badge badge-points">{{ device._pointCount || 0 }}</span>
                      </div>
                      <!-- 测点子列表（同 v-for 作用域内，v-if 放内层避免优先级问题） -->
                      <template v-if="expandedMap[`device-${device.code}`]">
                        <div v-loading="device._loadingPoints" style="min-height: 24px">
                          <div
                            v-for="point in device._points || []"
                            :key="point.id"
                            class="node-row node-point"
                            :class="{ 'is-active': selectedNode && selectedNode.code === point.code && selectedNode.nodeType === 'point' }"
                            @click="selectPoint(point, device)"
                          >
                            <span class="expand-indent" style="width: 44px"></span>
                            <span class="node-icon-box icon-point"><el-icon :size="14"><Odometer /></el-icon></span>
                            <span class="node-label" :title="point.name">{{ point.name }}</span>
                            <span class="node-status" :class="statusClass(point)"></span>
                          </div>
                          <div v-if="!device._points || device._points.length === 0" class="empty-children">暂无测点</div>
                        </div>
                      </template>
                    </template>
                    <div v-if="!station._devices || station._devices.length === 0" class="empty-children">暂无设备</div>
                  </div>
                </template>
              </div>
            </el-scrollbar>
            <el-empty v-else description="暂无站点数据" :image-size="60" />
          </div>
          <div class="pagination-box" v-show="total > 0">
            <el-pagination
              v-model:current-page="queryParams.pageNum"
              v-model:page-size="queryParams.pageSize"
              :total="total"
              layout="prev, pager, next"
              small
              background
              @current-change="loadStations"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：详情面板 -->
      <el-col :span="17" class="right-col">
        <template v-if="selectedNode">
          <!-- 节点信息卡片 -->
          <div class="node-info-bar">
            <div class="node-info-main">
              <span class="node-type-tag" :class="`tag-${selectedNode.nodeType}`">{{ typeLabels[selectedNode.nodeType] }}</span>
              <span class="node-name">{{ selectedNode.name }}</span>
              <el-tag size="small" :type="statusTagType(selectedNode.iotStatus)" effect="light" round>
                {{ iotStatusText(selectedNode.iotStatus) }}
              </el-tag>
            </div>
            <div class="node-info-meta">
              <span class="meta-item"><span class="meta-key">编码</span> {{ selectedNode.code }}</span>
              <span v-if="selectedNode.parentCode" class="meta-item"><span class="meta-key">上级编码</span> {{ selectedNode.parentCode }}</span>
              <span v-if="selectedNode.extra" class="meta-item"><span class="meta-key">{{ selectedNode.extra.label }}</span> {{ selectedNode.extra.value }}</span>
            </div>
          </div>
          <!-- 数据视图 -->
          <div class="data-viewer-card">
            <DataViewer
              :key="selectedNode.code + selectedNode.nodeType"
              :viewType="selectedNode.nodeType"
              :code="selectedNode.code"
              :parentCode="selectedNode.parentCode || ''"
              :name="selectedNode.name"
            />
          </div>
        </template>

        <!-- 无数据时的兜底 -->
        <div v-else class="welcome-panel">
          <div class="welcome-ring">
            <el-icon :size="36"><Connection /></el-icon>
          </div>
          <p class="welcome-title">暂无数据</p>
          <p class="welcome-desc">请在左侧选择一个站点查看实时监测数据</p>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { listStation, listDevice, listPoint, listPipe } from '@/api/water-basic/equipment'
import DataViewer from '@/components/DataViewer/index.vue'
import { OfficeBuilding, Cpu, Odometer, Share, Connection, ArrowRight, ArrowDown } from '@element-plus/icons-vue'

const stats = reactive({ stationCount: 0, deviceCount: 0, pointCount: 0, pipeCount: 0 })
const selectedNode = ref(null)
const loading = ref(false)
const stationList = ref([])
const total = ref(0)
const expandedMap = reactive({})
const typeLabels = { station: '站点', device: '设备', point: '测点' }

const queryParams = ref({ pageNum: 1, pageSize: 30, name: undefined })

function extract(res, key) {
  if (!res) return { list: [], total: 0 }
  if (res.data) return { list: res.data.list || res.data || [], total: res.data.total || (res.data.list ? res.data.list.length : 0) }
  if (res.rows) return { list: res.rows, total: res.total || res.rows.length }
  return { list: key ? (res[key] || []) : [], total: 0 }
}

function statusClass(row) {
  const s = String(row.iotStatus ?? row.status ?? '0')
  if (s === '0') return 'st-online'
  if (s === '1') return 'st-abnormal'
  if (s === '3') return 'st-alarm'
  return 'st-offline'
}

function statusTagType(s) {
  const v = String(s ?? '0')
  if (v === '0') return 'success'
  if (v === '1') return 'warning'
  if (v === '3') return 'danger'
  return 'info'
}

function iotStatusText(s) {
  const v = String(s ?? '0')
  if (v === '0') return '在线'
  if (v === '1') return '异常'
  if (v === '3') return '报警'
  return '离线'
}

async function loadStats() {
  try {
    const [s, d, p, pi] = await Promise.all([
      listStation({ pageNum: 1, pageSize: 1 }),
      listDevice({ pageNum: 1, pageSize: 1 }),
      listPoint({ pageNum: 1, pageSize: 1 }),
      listPipe({ pageNum: 1, pageSize: 1 })
    ])
    stats.stationCount = s.total ?? s.data?.total ?? 0
    stats.deviceCount = d.total ?? d.data?.total ?? 0
    stats.pointCount = p.total ?? p.data?.total ?? 0
    stats.pipeCount = pi.total ?? pi.data?.total ?? 0
  } catch (e) { console.error('stats error', e) }
}

async function loadStations() {
  loading.value = true
  try {
    // Clear expansions when page changes
    for (const key of Object.keys(expandedMap)) delete expandedMap[key]
    const res = await listStation(queryParams.value)
    const { list, total: t } = extract(res)
    stationList.value = list.map(s => ({ ...s, _devices: null, _deviceCount: 0, _loadingDevices: false }))
    total.value = t || list.length

    // 默认选中第一个站点
    if (list.length > 0 && !selectedNode.value) {
      selectStation(list[0])
    }

    // Batch-fetch device counts for visible stations
    if (list.length > 0) {
      const codes = list.map(s => s.code).filter(Boolean)
      if (codes.length > 0) {
        listDevice({ pageNum: 1, pageSize: 1, stationCodes: codes.join(',') }).then(dRes => {
          const dTotal = dRes.total ?? dRes.data?.total ?? 0
          // Just use per-station count from device list if available
        }).catch(() => {})
      }
    }
  } catch (e) { console.error('load stations error', e) }
  finally { loading.value = false }
}

async function toggleExpand(type, node, parent) {
  const key = `${type}-${node.code}`
  if (expandedMap[key]) {
    delete expandedMap[key]
    return
  }

  expandedMap[key] = true

  if (type === 'station') {
    // Lazy load devices for this station
    node._loadingDevices = true
    try {
      const res = await listDevice({ pageNum: 1, pageSize: 9999, stationCode: node.code })
      const { list: devices } = extract(res)
      node._devices = (devices || []).map(d => ({ ...d, _points: null, _pointCount: 0, _loadingPoints: false }))
      node._deviceCount = node._devices.length
    } catch (e) { console.error('load devices error', e) }
    finally { node._loadingDevices = false }
  } else if (type === 'device') {
    // Lazy load points for this device
    node._loadingPoints = true
    try {
      const res = await listPoint({ pageNum: 1, pageSize: 9999, deviceCode: node.code })
      const { list: points } = extract(res)
      node._points = points || []
      node._pointCount = node._points.length
    } catch (e) { console.error('load points error', e) }
    finally { node._loadingPoints = false }
  }
}

function selectStation(station) {
  selectedNode.value = {
    nodeType: 'station', code: station.code, name: station.name,
    iotStatus: station.iotStatus ?? '0', parentCode: '',
    extra: station.type ? { label: '类型', value: station.type } : null
  }
}

function selectDevice(device, station) {
  selectedNode.value = {
    nodeType: 'device', code: device.code, name: device.name,
    iotStatus: device.iotStatus ?? '0', parentCode: station.code || '',
    extra: device.type ? { label: '类型', value: device.type } : null
  }
}

function selectPoint(point, device) {
  selectedNode.value = {
    nodeType: 'point', code: point.code, name: point.name,
    iotStatus: point.iotStatus ?? '0', parentCode: device.code || '',
    extra: point.unit ? { label: '单位', value: point.unit } : (point.type ? { label: '类型', value: point.type } : null)
  }
}

function handleSearch() {
  queryParams.value.pageNum = 1
  // Clear expanded state and selected node
  for (const key of Object.keys(expandedMap)) delete expandedMap[key]
  selectedNode.value = null
  loadStations()
}

onMounted(() => {
  loadStats()
  loadStations()
})
</script>

<style scoped>
.overview-container { height: 100%; display: flex; flex-direction: column; gap: 14px; box-sizing: border-box; }

/* ===== 统计卡片 ===== */
.stat-row { flex-shrink: 0; margin: 0 !important; }
.stat-card {
  height: 82px; border-radius: 12px; background: #fff; overflow: hidden;
  border: 1px solid #ebeef5; box-shadow: 0 2px 10px rgba(0,0,0,.03);
  transition: transform .2s, box-shadow .2s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,.06); }
.stat-content { display: flex; justify-content: space-between; align-items: center; height: 100%; padding: 0 18px; }
.stat-label { font-size: 12px; color: #909399; margin-bottom: 4px; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; line-height: 1; font-family: 'Helvetica Neue', Arial, sans-serif; }
.stat-icon-box { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.stat-station .stat-icon-box { background: #ecf5ff; color: #409eff; }
.stat-device .stat-icon-box  { background: #f0f9eb; color: #67c23a; }
.stat-point .stat-icon-box   { background: #fdf6ec; color: #e6a23c; }
.stat-pipe .stat-icon-box    { background: #f4f0fe; color: #8b5cf6; }

/* ===== 主区域 ===== */
.main-row { flex: 1; margin: 0 !important; min-height: 0; }
.left-col, .right-col { height: 100%; display: flex; flex-direction: column; min-height: 0; }

/* ===== 左面板 ===== */
.list-panel {
  flex: 1; display: flex; flex-direction: column; min-height: 0;
  border-radius: 12px; border: 1px solid #ebeef5; box-shadow: 0 2px 10px rgba(0,0,0,.03);
}
.list-panel :deep(.el-card__header) { padding: 12px 14px 8px; border-bottom: 1px solid #f0f2f5; background: #fafbfc; }
.list-panel :deep(.el-card__body) { flex: 1; padding: 0; display: flex; flex-direction: column; min-height: 0; }

.panel-header { display: flex; justify-content: space-between; align-items: center; }
.header-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; color: #303133; }
.title-dot { width: 4px; height: 14px; border-radius: 2px; background: #409eff; }
.tree-search { margin-top: 8px; }

.list-body { flex: 1; overflow: hidden; min-height: 0; padding: 6px 0; }

/* ===== 节点行 ===== */
.tree-node-list { border-bottom: 1px solid #f5f5f5; }
.node-row {
  display: flex; align-items: center; gap: 6px; padding: 8px 14px;
  cursor: pointer; transition: background .15s; font-size: 13px;
}
.node-row:hover { background: #f5f7fa; }
.node-row.is-active { background: #ecf5ff; }

.expand-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #909399; cursor: pointer; }
.expand-icon:hover { color: #409eff; }
.expand-indent { flex-shrink: 0; }

.node-icon-box { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.icon-station { background: #ecf5ff; color: #409eff; }
.icon-device  { background: #f0f9eb; color: #67c23a; }
.icon-point   { background: #fdf6ec; color: #e6a23c; }

.node-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #303133; min-width: 0; }

.node-status { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.st-online  { background: #67c23a; }
.st-abnormal { background: #e6a23c; }
.st-alarm   { background: #f56c6c; }
.st-offline { background: #c0c4cc; }

.node-badge { font-size: 10px; padding: 1px 7px; border-radius: 10px; font-weight: 500; flex-shrink: 0; min-width: 22px; text-align: center; }
.badge-devices { background: #fdf6ec; color: #b88230; }
.badge-points  { background: #ecf5ff; color: #407ec9; }

.node-device { padding-left: 20px; }
.node-point  { padding-left: 0; }

.empty-children { padding: 6px 14px 6px 54px; font-size: 12px; color: #c0c4cc; }

.pagination-box { padding: 8px 14px; border-top: 1px solid #f0f2f5; display: flex; justify-content: center; background: #fff; }

/* ===== 右侧面板 ===== */
.node-info-bar {
  flex-shrink: 0;
  padding: 14px 20px;
  background: #fff;
  border-radius: 12px 12px 0 0;
  border: 1px solid #ebeef5;
  border-bottom: none;
}
.node-info-main { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.node-type-tag {
  font-size: 11px; padding: 2px 10px; border-radius: 6px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .5px;
}
.tag-station { background: #ecf5ff; color: #409eff; }
.tag-device  { background: #f0f9eb; color: #67c23a; }
.tag-point   { background: #fdf6ec; color: #e6a23c; }
.node-name { font-size: 16px; font-weight: 700; color: #1e293b; }
.node-info-meta { display: flex; gap: 16px; padding-left: 2px; }
.meta-item { font-size: 12px; color: #909399; }
.meta-key { color: #c0c4cc; margin-right: 4px; font-size: 11px; }

.data-viewer-card {
  flex: 1; min-height: 0;
  border-radius: 0 0 12px 12px;
  border: 1px solid #ebeef5; border-top: none;
  background: #fff; overflow: hidden;
}

/* ===== 空状态 ===== */
.welcome-panel {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #fff; border-radius: 12px; border: 1px solid #ebeef5; text-align: center; gap: 8px;
}
.welcome-ring {
  width: 72px; height: 72px; border-radius: 50%;
  background: #f0f6ff; display: flex; align-items: center; justify-content: center;
  color: #a0c4ff; margin-bottom: 4px;
}
.welcome-title { font-size: 15px; font-weight: 600; color: #303133; margin: 0; }
.welcome-desc { font-size: 13px; color: #909399; margin: 0; }
</style>
