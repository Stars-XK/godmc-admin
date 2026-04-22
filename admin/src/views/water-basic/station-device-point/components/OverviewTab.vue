<template>
  <div class="overview-container">
    <el-row :gutter="20" class="full-height-row">
      <!-- 左侧：站点列表 -->
      <el-col :span="8" class="left-col">
        <el-card class="box-card list-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <div class="title-accent"></div>
                <span>物联站点列表</span>
              </div>
              <el-tag size="small" effect="light" class="custom-tag">{{ total }} 站点</el-tag>
            </div>
            <div class="search-box" style="margin-top: 15px;">
              <el-input
                v-model="queryParams.name"
                placeholder="输入站点名称搜索"
                prefix-icon="Search"
                clearable
                @keyup.enter="handleSearch"
                @clear="handleSearch"
              />
            </div>
          </template>
          <div class="station-list-container" v-loading="loading">
            <el-scrollbar>
              <div
                v-for="station in stationList"
                :key="station.id"
                class="station-item"
                :class="{ 'is-active': selectedNode && selectedNode.code === station.code }"
                @click="handleStationClick(station)"
              >
                <div class="station-icon" :class="getStationStatusClass(station)">
                  <el-icon><OfficeBuilding /></el-icon>
                </div>
                <div class="station-info">
                  <div class="station-name" :title="station.name">{{ station.name }}</div>
                  <div class="station-code">{{ station.code }}</div>
                </div>
                <div class="station-status-indicator" :class="getStationStatusClass(station)"></div>
              </div>
              <el-empty v-if="stationList.length === 0 && !loading" description="暂无站点数据" :image-size="60"></el-empty>
            </el-scrollbar>
          </div>
          <div class="pagination-container">
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

      <!-- 右侧：统计与数据视图 -->
      <el-col :span="16" class="right-col">
        <!-- 顶部统计 -->
        <div v-if="!selectedNode || selectedNode.nodeType === 'station'" class="global-dashboard" style="display: flex; flex-direction: column; height: 100%;">
          <el-row :gutter="20" class="stat-row">
            <el-col :span="8">
              <div class="stat-card stat-station">
                <div class="stat-bg-shape"></div>
                <div class="stat-content">
                  <div class="stat-info">
                    <div class="stat-title">接入站点</div>
                    <div class="stat-value">{{ stats.stationCount }}</div>
                  </div>
                  <div class="stat-icon-box">
                    <el-icon><OfficeBuilding /></el-icon>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card stat-device">
                <div class="stat-bg-shape"></div>
                <div class="stat-content">
                  <div class="stat-info">
                    <div class="stat-title">监测设备</div>
                    <div class="stat-value">{{ stats.deviceCount }}</div>
                  </div>
                  <div class="stat-icon-box">
                    <el-icon><Cpu /></el-icon>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card stat-point">
                <div class="stat-bg-shape"></div>
                <div class="stat-content">
                  <div class="stat-info">
                    <div class="stat-title">感知测点</div>
                    <div class="stat-value">{{ stats.pointCount }}</div>
                  </div>
                  <div class="stat-icon-box">
                    <el-icon><Odometer /></el-icon>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>

          <div class="detail-dashboard" style="height: 100%; flex: 1;">
            <el-card class="box-card chart-card" shadow="never" style="height: 100%; border: none;">
              <template #header>
                <div class="card-header" style="justify-content: space-between; display: flex;">
                  <div class="header-title" style="display: flex; align-items: center;">
                    <div class="title-accent"></div>
                    <span style="font-weight: bold; font-size: 15px;">{{ selectedNode ? selectedNode.name : '全网' }} - 实时数据视图</span>
                  </div>
                </div>
              </template>
              <DataViewer
                v-if="selectedNode"
                :viewType="selectedNode.nodeType"
                :code="selectedNode.code"
                :parentCode="selectedNode.parentCode"
                :name="selectedNode.name || selectedNode.label"
              />
              <el-empty v-else description="请在左侧点击站点查看实时数据" :image-size="80"></el-empty>
            </el-card>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listStation, listDevice, listPoint } from '@/api/water-basic/equipment'
import DataViewer from '@/components/DataViewer/index.vue'

const stats = ref({ stationCount: 0, deviceCount: 0, pointCount: 0 })
const selectedNode = ref(null)

const loading = ref(false)
const stationList = ref([])
const total = ref(0)
const queryParams = ref({
  pageNum: 1,
  pageSize: 20,
  name: undefined
})

function getStationStatusClass(station) {
  // 根据用户需求：在线绿色(0)，异常黄色(1)，离线灰色(2)
  // 这里暂时用 status (0=正常 1=停用) 做 fallback
  const s = String(station.iotStatus || station.status || '0')
  if (s === '0') return 'status-online'
  if (s === '1') return 'status-abnormal'
  return 'status-offline'
}

async function loadStats() {
  try {
    const [sRes, dRes, pRes] = await Promise.all([
      listStation({ pageNum: 1, pageSize: 1 }),
      listDevice({ pageNum: 1, pageSize: 1 }),
      listPoint({ pageNum: 1, pageSize: 1 })
    ])
    stats.value.stationCount = sRes.total || (sRes.data && sRes.data.total) || 0
    stats.value.deviceCount = dRes.total || (dRes.data && dRes.data.total) || 0
    stats.value.pointCount = pRes.total || (pRes.data && pRes.data.total) || 0
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

async function loadStations() {
  loading.value = true
  try {
    const sRes = await listStation(queryParams.value)
    stationList.value = sRes.rows || (sRes.data && sRes.data.list) || []
    total.value = sRes.total || (sRes.data && sRes.data.total) || 0
  } catch (error) {
    console.error('加载站点列表失败', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.value.pageNum = 1
  loadStations()
}

function handleStationClick(station) {
  selectedNode.value = {
    nodeType: 'station',
    code: station.code,
    name: station.name,
    parentCode: ''
  }
}

onMounted(() => {
  loadStats()
  loadStations()
})
</script>

<style scoped>
.overview-container {
  height: 100%;
  box-sizing: border-box;
}

.full-height-row {
  height: 100%;
  margin: 0 !important;
}

.left-col, .right-col {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 通用卡片样式 */
.box-card {
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03) !important;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.box-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.box-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f5;
  background-color: #fafafa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.title-accent {
  width: 4px;
  height: 16px;
  background-color: #409EFF;
  border-radius: 2px;
  margin-right: 10px;
}

.title-accent.accent-purple {
  background-color: #8a2be2;
}

.custom-tag {
  border-radius: 12px;
  padding: 0 10px;
  font-weight: 500;
}

/* 树形组件区 */
.tree-card {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.tree-card :deep(.el-card__body) {
  flex: 1;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tree-container {
  flex: 1;
  padding: 16px;
  overflow: hidden; /* 这里改为 hidden，因为 el-tree-v2 自带虚拟列表滚动条 */
  min-height: 0;
}

.custom-tree {
  background: transparent;
  height: 100%;
}

.custom-tree :deep(.el-tree-node__content) {
  height: 40px;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s;
  overflow: hidden; /* 防止展开时子元素溢出 */
  padding-right: 8px;
}

.custom-tree :deep(.el-tree-node__content:hover) {
  background-color: #f2f6fc;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding-right: 12px;
  min-width: 0; /* 让 flex 截断生效 */
}

.node-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  margin-right: 10px;
  flex-shrink: 0; /* 防止图标被压缩 */
  font-size: 14px;
}

.icon-station { background: #ecf5ff; color: #409EFF; }
.icon-device { background: #f0f9eb; color: #67C23A; }
.icon-point { background: #fdf6ec; color: #E6A23C; }

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #606266;
  font-weight: 500;
  min-width: 0; /* 防止长文本撑开 flex 容器 */
}

.node-badges {
  display: flex;
  gap: 6px;
  margin-left: 8px;
  flex-shrink: 0; /* 防止徽章被压缩 */
}

.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid transparent;
}

.badge-station { background: #f4f4f5; color: #909399; border-color: #e9e9eb; }
.badge-device { background: #fdf6ec; color: #E6A23C; border-color: #faecd8; }

/* 右侧统计卡片区 */
.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  height: 100px;
  border-radius: 12px;
  background-color: #fff;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid #ebeef5;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-bg-shape {
  position: absolute;
  right: -20px;
  top: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: 0.1;
  z-index: 0;
}

.stat-station .stat-bg-shape { background: #409EFF; }
.stat-device .stat-bg-shape { background: #67C23A; }
.stat-point .stat-bg-shape { background: #E6A23C; }

.stat-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 24px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  line-height: 1;
}

.stat-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
}

.stat-station .stat-icon-box { background: #ecf5ff; color: #409EFF; }
.stat-device .stat-icon-box { background: #f0f9eb; color: #67C23A; }
.stat-point .stat-icon-box { background: #fdf6ec; color: #E6A23C; }

/* 右侧图表区 */
.chart-row {
  margin-bottom: 20px;
}

.sub-chart-card {
  height: 300px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.sub-chart-container {
  flex: 1;
  height: 240px;
  width: 100%;
  min-height: 0;
}

.chart-card {
  height: 350px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chart-card :deep(.el-card__body) {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chart-container {
  flex: 1;
  height: 290px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fafbfc;
  background-image: radial-gradient(#e4e7ed 1px, transparent 1px);
  background-size: 20px 20px;
  min-height: 0;
}

.empty-state-modern {
  text-align: center;
  position: relative;
  z-index: 1;
}

.pulse-ring {
  position: absolute;
  left: 50%;
  top: 30px;
  transform: translateX(-50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(138, 43, 226, 0.1);
  animation: pulse 2s infinite;
  z-index: -1;
}

@keyframes pulse {
  0% { transform: translateX(-50%) scale(0.8); opacity: 0.8; }
  100% { transform: translateX(-50%) scale(1.5); opacity: 0; }
}

.empty-icon {
  font-size: 48px;
  color: #8a2be2;
  margin-bottom: 16px;
  opacity: 0.8;
}

.empty-state-modern h3 {
  font-size: 18px;
  color: #303133;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.empty-state-modern p {
  font-size: 13px;
  color: #909399;
  margin: 0;
  max-width: 250px;
  line-height: 1.5;
}

/* 滚动条美化 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #c0c4cc;
}
</style>
