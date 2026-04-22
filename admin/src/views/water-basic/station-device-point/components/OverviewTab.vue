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
              <el-tag size="small" effect="light" class="custom-tag">{{ stats.stationCount }} 站点</el-tag>
            </div>
            <div class="search-box">
              <el-input
                v-model="searchName"
                placeholder="输入站点名称搜索"
                prefix-icon="Search"
                clearable
                @change="handleSearch"
              />
            </div>
          </template>
          <div class="tree-container">
            <el-tree-v2
              :key="treeKey"
              :data="treeData"
              :props="treeProps"
              :height="treeHeight"
              :expand-on-click-node="false"
              @node-expand="handleNodeExpand"
              class="custom-tree custom-scrollbar"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <div class="node-icon-wrapper" :class="'icon-' + data.nodeType">
                    <el-icon><component :is="getIcon(data.nodeType)" /></el-icon>
                  </div>
                  <span class="node-label" :title="node.label">{{ node.label }}</span>
                  <el-tag v-if="data.nodeType === 'device'" size="small" type="info" class="badge" effect="plain">设备</el-tag>
                  <el-tag v-if="data.nodeType === 'point'" size="small" type="warning" class="badge" effect="plain">测点</el-tag>
                </div>
              </template>
            </el-tree-v2>
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

        <el-row :gutter="20" class="chart-row">
          <el-col :span="12">
            <el-card class="box-card sub-chart-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <div class="header-title">
                    <div class="title-accent accent-green"></div>
                    <span>站点类型分布</span>
                  </div>
                </div>
              </template>
              <div class="sub-chart-container" ref="stationTypeChartRef"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="box-card sub-chart-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <div class="header-title">
                    <div class="title-accent accent-purple"></div>
                    <span>设备状态监控</span>
                  </div>
                </div>
              </template>
              <div class="sub-chart-container" ref="deviceStatusChartRef"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-card class="box-card chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <div class="title-accent accent-orange"></div>
                <span>近七日测点数据量趋势</span>
              </div>
            </div>
          </template>
          <div class="chart-container" ref="trendChartRef"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { listStation, listDevice, listPoint } from '@/api/water-basic/equipment'
import * as echarts from 'echarts'

const stats = ref({ stationCount: 0, deviceCount: 0, pointCount: 0 })
const searchName = ref('')
const treeKey = ref(1)
const treeData = ref([])
const treeHeight = ref(500)

const stationTypeChartRef = ref(null)
const deviceStatusChartRef = ref(null)
const trendChartRef = ref(null)

let stationChartInstance = null
let deviceChartInstance = null
let trendChartInstance = null

const treeProps = {
  value: 'id',
  label: 'label',
  children: 'children'
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

function createPlaceholder(parentId) {
  return [
    {
      id: `${parentId}_placeholder`,
      label: '加载中...',
      nodeType: 'placeholder',
      disabled: true,
      children: []
    }
  ]
}

async function loadStations() {
  try {
    const sRes = await listStation({ pageNum: 1, pageSize: 2000, name: searchName.value })
    const stations = sRes.rows || (sRes.data && sRes.data.list) || []
    treeData.value = stations.map(s => ({
      ...s,
      id: `s_${s.id}`,
      label: s.name,
      nodeType: 'station',
      _loaded: false,
      children: createPlaceholder(`s_${s.id}`)
    }))
  } catch (error) {
    console.error('加载拓扑树失败', error)
  }
}

function handleSearch() {
  treeKey.value++
  loadStations()
}

async function handleNodeExpand(data) {
  if (!data || data.disabled || data.nodeType === 'placeholder') return

  if (data.nodeType === 'station' && !data._loaded) {
    data.children = createPlaceholder(data.id)
    try {
      const res = await listDevice({ stationCode: data.code, pageNum: 1, pageSize: 2000 })
      const list = res.rows || (res.data && res.data.list) || []
      data.children = list.map(d => ({
        ...d,
        id: `d_${d.id}`,
        label: d.name,
        nodeType: 'device',
        _loaded: false,
        children: createPlaceholder(`d_${d.id}`)
      }))
      data._loaded = true
      treeData.value = [...treeData.value]
    } catch (e) {
      data.children = []
      data._loaded = true
      treeData.value = [...treeData.value]
    }
    return
  }

  if (data.nodeType === 'device' && !data._loaded) {
    data.children = createPlaceholder(data.id)
    try {
      const res = await listPoint({ deviceCode: data.code, pageNum: 1, pageSize: 2000 })
      const list = res.rows || (res.data && res.data.list) || []
      data.children = list.map(p => ({
        ...p,
        id: `p_${p.id}`,
        label: p.name,
        nodeType: 'point',
        children: []
      }))
      data._loaded = true
      treeData.value = [...treeData.value]
    } catch (e) {
      data.children = []
      data._loaded = true
      treeData.value = [...treeData.value]
    }
  }
}

function initCharts() {
  // 1. 站点类型分布 (Pie Chart)
  if (stationTypeChartRef.value) {
    stationChartInstance = echarts.init(stationTypeChartRef.value)
    const option = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: '0%', left: 'center', icon: 'circle', itemWidth: 10, itemHeight: 10 },
      color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'],
      series: [
        {
          name: '站点类型',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' }
          },
          labelLine: { show: false },
          data: [
            { value: Math.floor(stats.value.stationCount * 0.45) || 45, name: '水厂' },
            { value: Math.floor(stats.value.stationCount * 0.25) || 25, name: '泵站' },
            { value: Math.floor(stats.value.stationCount * 0.15) || 15, name: '调压站' },
            { value: Math.floor(stats.value.stationCount * 0.10) || 10, name: '管网监测' },
            { value: Math.floor(stats.value.stationCount * 0.05) || 5, name: '其他' }
          ]
        }
      ]
    }
    stationChartInstance.setOption(option)
  }

  // 2. 设备状态监控 (Bar Chart)
  if (deviceStatusChartRef.value) {
    deviceChartInstance = echarts.init(deviceStatusChartRef.value)
    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '5%', right: '5%', bottom: '5%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['在线运行', '待机休眠', '离线断网', '故障报警', '维保中'],
        axisLine: { lineStyle: { color: '#e4e7ed' } },
        axisLabel: { color: '#606266' },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } },
        axisLabel: { color: '#909399' }
      },
      series: [
        {
          name: '设备数量',
          type: 'bar',
          barWidth: '40%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#a18cd1' },
              { offset: 1, color: '#fbc2eb' }
            ]),
            borderRadius: [6, 6, 0, 0]
          },
          data: [
            Math.floor(stats.value.deviceCount * 0.70) || 700,
            Math.floor(stats.value.deviceCount * 0.15) || 150,
            Math.floor(stats.value.deviceCount * 0.08) || 80,
            Math.floor(stats.value.deviceCount * 0.05) || 50,
            Math.floor(stats.value.deviceCount * 0.02) || 20
          ]
        }
      ]
    }
    deviceChartInstance.setOption(option)
  }

  // 3. 测点数据量趋势 (Line Chart)
  if (trendChartRef.value) {
    trendChartInstance = echarts.init(trendChartRef.value)
    
    // Generate dates for the last 7 days
    const dates = []
    for(let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push(`${d.getMonth()+1}-${d.getDate()}`)
    }
    
    const baseValue = stats.value.pointCount > 0 ? stats.value.pointCount : 10000;
    
    const option = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#eee',
        textStyle: { color: '#333' }
      },
      legend: { data: ['流量数据', '压力数据'], top: '2%', right: '5%', icon: 'roundRect' },
      grid: { left: '3%', right: '4%', bottom: '5%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: '#dcdfe6' } },
        axisLabel: { color: '#606266' }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } },
        axisLabel: { color: '#909399' }
      },
      series: [
        {
          name: '流量数据',
          type: 'line',
          smooth: true,
          symbolSize: 8,
          lineStyle: { width: 3, color: '#E6A23C' },
          itemStyle: { color: '#E6A23C', borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(230,162,60,0.3)' },
              { offset: 1, color: 'rgba(230,162,60,0.05)' }
            ])
          },
          data: [
            baseValue * 0.8, baseValue * 0.85, baseValue * 0.82, 
            baseValue * 0.9, baseValue * 0.95, baseValue * 0.98, baseValue
          ].map(Math.floor)
        },
        {
          name: '压力数据',
          type: 'line',
          smooth: true,
          symbolSize: 8,
          lineStyle: { width: 3, color: '#409EFF' },
          itemStyle: { color: '#409EFF', borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64,158,255,0.3)' },
              { offset: 1, color: 'rgba(64,158,255,0.05)' }
            ])
          },
          data: [
            baseValue * 0.5, baseValue * 0.52, baseValue * 0.58, 
            baseValue * 0.55, baseValue * 0.6, baseValue * 0.65, baseValue * 0.7
          ].map(Math.floor)
        }
      ]
    }
    trendChartInstance.setOption(option)
  }
}

function handleResize() {
  if (stationChartInstance) stationChartInstance.resize()
  if (deviceChartInstance) deviceChartInstance.resize()
  if (trendChartInstance) trendChartInstance.resize()
}

onMounted(() => {
  loadStats().then(() => {
    nextTick(() => {
      initCharts()
    })
  })
  loadStations()
  
  // Resize tree based on window height
  const updateHeight = () => {
    const treeEl = document.querySelector('.tree-container')
    if (treeEl) {
      treeHeight.value = treeEl.clientHeight
    } else {
      treeHeight.value = window.innerHeight - 240
    }
  }
  updateHeight()
  window.addEventListener('resize', updateHeight)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (stationChartInstance) stationChartInstance.dispose()
  if (deviceChartInstance) deviceChartInstance.dispose()
  if (trendChartInstance) trendChartInstance.dispose()
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
