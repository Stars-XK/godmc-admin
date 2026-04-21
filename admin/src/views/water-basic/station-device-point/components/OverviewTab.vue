<template>
  <div class="overview-tab">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="box-card tree-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>物联拓扑结构</span>
              <el-tag size="small" type="primary">{{ treeData.length }} 站点</el-tag>
            </div>
          </template>
          <div class="tree-container">
            <el-tree
              :data="treeData"
              :props="defaultProps"
              node-key="id"
              default-expand-all
              :expand-on-click-node="false"
              class="custom-tree"
            >
              <template #default="{ node, data }">
                <span class="custom-tree-node">
                  <el-icon :color="getIconColor(data.nodeType)">
                    <component :is="getIcon(data.nodeType)" />
                  </el-icon>
                  <span class="node-label">{{ node.label }}</span>
                  <el-tag v-if="data.nodeType === 'station'" size="small" type="success" effect="plain" class="node-badge">
                    {{ data.children?.length || 0 }} 设备
                  </el-tag>
                  <el-tag v-if="data.nodeType === 'device'" size="small" type="warning" effect="plain" class="node-badge">
                    {{ data.children?.length || 0 }} 测点
                  </el-tag>
                </span>
              </template>
            </el-tree>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-row :gutter="20" class="mb-4">
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card stat-blue">
              <div class="stat-icon"><el-icon><OfficeBuilding /></el-icon></div>
              <div class="stat-content">
                <div class="stat-title">站点总数</div>
                <div class="stat-value">{{ stats.stationCount }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card stat-green">
              <div class="stat-icon"><el-icon><Cpu /></el-icon></div>
              <div class="stat-content">
                <div class="stat-title">设备总数</div>
                <div class="stat-value">{{ stats.deviceCount }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card stat-orange">
              <div class="stat-icon"><el-icon><Odometer /></el-icon></div>
              <div class="stat-content">
                <div class="stat-title">测点总数</div>
                <div class="stat-value">{{ stats.pointCount }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card class="box-card chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>状态分布</span>
            </div>
          </template>
          <div class="chart-placeholder">
            <div class="empty-chart">
              <el-icon :size="40" color="#c0c4cc"><PieChart /></el-icon>
              <p>暂无足够数据生成图表</p>
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
.mb-4 { margin-bottom: 20px; }
.tree-card { min-height: 600px; }
.tree-container { max-height: 520px; overflow-y: auto; }
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }

.custom-tree {
  background: transparent;
}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding-right: 8px;
}
.node-label {
  margin-left: 8px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.node-badge {
  transform: scale(0.8);
}

.stat-card {
  border-radius: 8px;
  color: #fff;
  border: none;
}
.stat-blue { background: linear-gradient(135deg, #409EFF, #73b8ff); }
.stat-green { background: linear-gradient(135deg, #67C23A, #95d475); }
.stat-orange { background: linear-gradient(135deg, #E6A23C, #f3d19e); }

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
}
.stat-icon {
  font-size: 48px;
  opacity: 0.8;
  margin-right: 20px;
}
.stat-title {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.chart-card {
  height: 460px;
}
.chart-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 380px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #e4e7ed;
}
.empty-chart {
  text-align: center;
  color: #909399;
}
.empty-chart p {
  margin-top: 10px;
  font-size: 14px;
}
</style>
