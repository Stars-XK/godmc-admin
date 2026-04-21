<template>
  <div class="overview-container">
    <el-row :gutter="20" class="full-height-row">
      <!-- 左侧：拓扑树 -->
      <el-col :span="8" class="left-col">
        <el-card class="box-card tree-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <div class="title-accent"></div>
                <span>物联拓扑结构</span>
              </div>
              <el-tag size="small" effect="light" class="custom-tag">{{ treeData.length }} 站点</el-tag>
            </div>
          </template>
          <div class="tree-container custom-scrollbar">
            <el-tree
              :data="treeData"
              :props="defaultProps"
              node-key="id"
              default-expand-all
              :expand-on-click-node="false"
              class="custom-tree"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <div class="node-icon-wrapper" :class="'icon-' + data.nodeType">
                    <el-icon><component :is="getIcon(data.nodeType)" /></el-icon>
                  </div>
                  <span class="node-label" :title="node.label">{{ node.label }}</span>
                  <div class="node-badges">
                    <span v-if="data.nodeType === 'station'" class="badge badge-station">
                      {{ data.children?.length || 0 }} 设备
                    </span>
                    <span v-if="data.nodeType === 'device'" class="badge badge-device">
                      {{ data.children?.length || 0 }} 测点
                    </span>
                  </div>
                </div>
              </template>
            </el-tree>
            <el-empty v-if="treeData.length === 0" description="暂无拓扑数据" :image-size="100"></el-empty>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：统计与图表 -->
      <el-col :span="16" class="right-col">
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

        <el-card class="box-card chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <div class="title-accent accent-purple"></div>
                <span>设备状态分布</span>
              </div>
            </div>
          </template>
          <div class="chart-container">
            <div class="empty-state-modern">
              <div class="pulse-ring"></div>
              <el-icon class="empty-icon"><PieChart /></el-icon>
              <h3>图表数据采集中</h3>
              <p>接入更多测点数据后将在此处生成多维可视化分析</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listStation, listDevice, listPoint } from '@/api/water-basic/equipment'

const treeData = ref([])
const stats = ref({ stationCount: 0, deviceCount: 0, pointCount: 0 })

const defaultProps = {
  children: 'children',
  label: 'name'
}

function getIcon(type) {
  if (type === 'station') return 'OfficeBuilding'
  if (type === 'device') return 'Cpu'
  if (type === 'point') return 'Odometer'
  return 'Folder'
}

function getIconColor(type) {
  if (type === 'station') return '#409EFF'
  if (type === 'device') return '#67C23A'
  if (type === 'point') return '#E6A23C'
  return '#909399'
}

async function loadTopology() {
  // Fetch all for overview demo
  const [stationRes, deviceRes, pointRes] = await Promise.all([
    listStation({ pageNum: 1, pageSize: 1000 }),
    listDevice({ pageNum: 1, pageSize: 1000 }),
    listPoint({ pageNum: 1, pageSize: 1000 })
  ])

  const stations = stationRes.data?.list || []
  const devices = deviceRes.data?.list || []
  const points = pointRes.data?.list || []

  stats.value.stationCount = stations.length
  stats.value.deviceCount = devices.length
  stats.value.pointCount = points.length

  // Build Tree
  const pointMap = {}
  points.forEach(p => {
    if (!pointMap[p.deviceCode]) pointMap[p.deviceCode] = []
    pointMap[p.deviceCode].push({ ...p, nodeType: 'point', id: `p_${p.id}` })
  })

  const deviceMap = {}
  devices.forEach(d => {
    if (!deviceMap[d.stationCode]) deviceMap[d.stationCode] = []
    deviceMap[d.stationCode].push({
      ...d,
      nodeType: 'device',
      id: `d_${d.id}`,
      children: pointMap[d.code] || []
    })
  })

  const tree = stations.map(s => ({
    ...s,
    nodeType: 'station',
    id: `s_${s.id}`,
    children: deviceMap[s.code] || []
  }))

  treeData.value = tree
}

onMounted(() => {
  loadTopology()
})
</script>

<style scoped>
.overview-container {
  height: calc(100vh - 170px);
  min-height: 600px;
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
}

.tree-card :deep(.el-card__body) {
  flex: 1;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tree-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.custom-tree {
  background: transparent;
}

.custom-tree :deep(.el-tree-node__content) {
  height: 40px;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s;
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
  width: 0; /* 让 flex 截断生效 */
}

.node-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  margin-right: 10px;
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
}

.node-badges {
  display: flex;
  gap: 6px;
  margin-left: 8px;
}

.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.badge-station { background: #e1f3d8; color: #67C23A; }
.badge-device { background: #faecd8; color: #E6A23C; }

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
.chart-card {
  flex: 1;
}

.chart-card :deep(.el-card__body) {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.chart-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fafbfc;
  background-image: radial-gradient(#e4e7ed 1px, transparent 1px);
  background-size: 20px 20px;
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
