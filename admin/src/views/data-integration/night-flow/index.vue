<template>
  <div class="app-container night-flow-container">
    <div class="left-panel">
      <div class="panel-header">
        <span class="title">分区夜间最小流量</span>
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="请输入分区名称搜索"
            size="small"
            clearable
            @input="handleSearch"
          ></el-input>
        </div>
        <el-button type="warning" plain size="small" icon="Guide" @click="showDataFlow = true">数据流转</el-button>
      </div>
      <div class="list-container" ref="listContainer" @scroll="handleScroll">
        <div class="list-phantom" :style="{ height: totalHeight + 'px' }"></div>
        <div class="list-inner" :style="{ transform: `translateY(${offsetTop}px)` }">
          <div 
            v-for="item in visibleData" 
            :key="item.zoneCode" 
            class="zone-card"
            :class="{ 'is-alarm': item.isAlarm, 'is-focus': item.isFocus }"
            @click="handleRowClick(item)"
          >
            <div class="card-header">
              <div class="zone-info" :style="{ paddingLeft: (item.level - 1) * 24 + 'px' }">
                <span
                  v-if="item.hasChildren"
                  class="expand-toggle"
                  :class="{ 'is-expanded': item.expanded }"
                  @click.stop="toggleExpand(item)"
                ></span>
                <span v-else class="expand-toggle invisible"></span>
                <span class="level-badge" :class="'level-' + item.level">L{{ item.level }}</span>
                <span class="zone-name">{{ item.zoneName }}</span>
              </div>
              <div class="zone-actions">
                <el-tag v-if="item.isAlarm" type="danger" size="small" effect="dark" style="margin-right: 12px;">报警</el-tag>
                <el-button link type="primary" @click.stop="openDrawer(item)">
                  详情 <i class="el-icon-arrow-right" style="margin-left: 2px;"></i>
                </el-button>
              </div>
            </div>
            
            <div class="card-body">
              <div class="data-row">
                <div class="data-item">
                  <span class="label">今日夜小</span>
                  <span class="value">{{ formatVal(item.todayVal) }}</span>
                </div>
                <div class="data-item">
                  <span class="label">昨日夜小</span>
                  <span class="value">{{ formatVal(item.yesterdayVal) }}</span>
                </div>
                <div class="data-item">
                  <span class="label">插值</span>
                  <span class="value" :class="getTrendClass(item.diffVal)">
                    {{ item.diffVal > 0 ? '+' : '' }}{{ formatVal(item.diffVal) }}
                  </span>
                </div>
                <div class="data-item">
                  <span class="label">比率</span>
                  <span class="value" :class="getTrendClass(item.ratio)">
                    <i :class="getTrendIcon(item.ratio)"></i>
                    {{ item.ratio > 0 ? '+' : '' }}{{ item.ratio !== null ? item.ratio + '%' : '--' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <el-empty v-if="renderData.length === 0" description="暂无数据" :image-size="100"></el-empty>
        </div>
      </div>
    </div>
    
    <div class="right-panel">
      <div class="map-container" ref="mapContainer" style="width: 100%; height: 100%;">
        <!-- 默认提示遮罩，当未初始化地图时显示 -->
        <div class="map-placeholder" v-if="!mapInstance">
          <div class="map-content">
            <el-icon style="font-size: 48px; color: #909399; margin-bottom: 16px;"><LocationInformation /></el-icon>
            <h2>GIS 地图区域</h2>
            <p v-if="activeZone">当前定位分区: <strong>{{ activeZone.zoneName }}</strong></p>
            <p v-else>请点击左侧分区列表定位</p>
            <p v-if="!amapKey" style="color:#F56C6C; margin-top: 10px; font-size: 12px;">（需在系统参数中配置高德地图Key）</p>
          </div>
        </div>
      </div>
    </div>

    <el-drawer
      :title="drawerTitle"
      v-model="drawerVisible"
      direction="ltr"
      size="60%"
      destroy-on-close
      class="night-flow-drawer"
      @open="handleDrawerOpen"
      @opened="handleDrawerOpened"
      @close="handleDrawerClose"
    >
      <div class="drawer-content" v-loading="drawerLoading">
        <div class="drawer-row full-width">
          <el-card class="box-card" shadow="never">
            <div slot="header" class="clearfix">
              <span>分区 30 天夜间最小流量趋势</span>
            </div>
            <div class="chart-container">
              <div id="chart-30day" style="width: 100%; height: 100%;"></div>
            </div>
          </el-card>
        </div>
        
        <div class="drawer-row full-width">
          <el-card class="box-card" shadow="never">
            <div slot="header" class="clearfix">
              <span>分区 10 天小时表数据</span>
            </div>
            <div class="chart-container">
              <div id="chart-10day" style="width: 100%; height: 100%;"></div>
            </div>
          </el-card>
        </div>
        
        <div class="drawer-row half-width-container">
          <div class="drawer-col half-width">
            <el-card class="box-card" shadow="never">
              <div slot="header" class="clearfix">
                <span>测点最新数据</span>
                <el-button style="float: right; padding: 3px 0" link type="primary" icon="Refresh" @click="refreshLatestData"></el-button>
              </div>
              <div class="list-content">
                <el-table :data="latestDataList" size="small" height="250">
                  <el-table-column prop="pointName" label="测点名称" show-overflow-tooltip></el-table-column>
                  <el-table-column prop="val" label="最新值" width="100">
                    <template #default="scope">
                      <span class="value-highlight">{{ scope.row.val }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="ts" label="更新时间" width="140"></el-table-column>
                </el-table>
              </div>
            </el-card>
          </div>
          
          <div class="drawer-col half-width">
            <el-card class="box-card" shadow="never">
              <div slot="header" class="clearfix">
                <span>实时报警数据</span>
              </div>
              <div class="list-content">
                <el-table :data="alarmList" size="small" height="250">
                  <el-table-column prop="time" label="报警时间" width="140"></el-table-column>
                  <el-table-column prop="content" label="报警内容" show-overflow-tooltip></el-table-column>
                  <el-table-column prop="level" label="等级" width="80">
                    <template #default="scope">
                      <el-tag size="small" :type="scope.row.level === '严重' ? 'danger' : 'warning'">{{ scope.row.level }}</el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 数据流转弹窗 -->
    <DataFlowDialog v-model="showDataFlow" title="夜间最小流量数据流转" :stages="nightFlowStages" />
  </div>
</template>

<script setup name="ZoneNightFlow">
import { ref, shallowRef, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Search, LocationInformation, Setting, FullScreen, Location, Guide, TrendCharts, Clock, Moon, MagicStick, BellFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { listZoneTree, lazyZoneChildren } from '@/api/water-basic/zone'
import { getConfigKey } from '@/api/system/config'
import * as echarts from 'echarts'
import { useAMap } from '@/hooks/useAMap'
import DataFlowDialog from '@/components/Monitor/DataFlowDialog.vue'

// 树形列表展平后的全部数据
const flatData = ref([])
const renderData = ref([])

const searchQuery = ref('')

// 数据流转弹窗
const showDataFlow = ref(false)
const nightFlowStages = [
  {
    key: 'zone_tree', label: '分区树加载', shortLabel: '分区树',
    icon: Location, color: '#3B82F6',
    description: '前端调用 listZoneTree API 获取分区层级树，虚拟滚动渲染（itemHeight=88, visibleCount=18），按展开/折叠状态构建可见列表',
    tech: 'Vue3 + 虚拟滚动', input: 'water_zone 表', output: '分区树形卡片列表',
    frequency: '页面加载 / 展开折叠', method: 'buildTree() + handleScroll()', file: 'admin/src/views/data-integration/night-flow/index.vue',
    active: true, count: '—',
  },
  {
    key: 'tdengine_night', label: 'TDengine夜间查询', shortLabel: '夜间查询',
    icon: Moon, color: '#6366F1',
    description: 'QueryService.getZoneNightFlowBatch() 批量查询所有分区的 zone_meters_5m，夜间时段(02:00-04:00)内 MIN(total_val) 作为夜间最小流量',
    tech: 'TDengine REST API', input: 'zone_meters_5m 超表', output: '各分区今日/昨日夜小值',
    frequency: '页面加载 / 定时刷新', method: 'QueryService.getZoneNightFlowBatch()', file: 'micro-data-integration/query/query.service.ts',
    active: true, count: '—',
  },
  {
    key: 'today_min', label: '今日夜小计算', shortLabel: '今日MIN',
    icon: Clock, color: '#0D9488',
    description: 'SELECT MIN(total_val) FROM zone_meters_5m WHERE zoneCode = ? AND time BETWEEN today_night_start AND today_night_end，返回今日夜间最小流量值',
    tech: 'TDengine SQL', input: '今日凌晨 02:00-04:00 数据', output: 'todayVal (m³/h)',
    frequency: '每次刷新', method: 'getZoneNightFlowBatch() today分支', file: 'micro-data-integration/query/query.service.ts',
    active: true, count: '—',
  },
  {
    key: 'yesterday_min', label: '昨日夜小对比', shortLabel: '昨日MIN',
    icon: TrendCharts, color: '#D97706',
    description: '同样查询昨日同一时段 MIN(total_val)，与今日值对比。夜小上升通常意味着漏损增加或非法用水',
    tech: 'TDengine SQL', input: '昨日凌晨 02:00-04:00 数据', output: 'yesterdayVal (m³/h)',
    frequency: '每次刷新', method: 'getZoneNightFlowBatch() yesterday分支', file: 'micro-data-integration/query/query.service.ts',
    active: true, count: '—',
  },
  {
    key: 'diff_ratio', label: '差值/比率计算', shortLabel: '差值比率',
    icon: MagicStick, color: '#8B5CF6',
    description: 'diffVal = todayVal - yesterdayVal; ratio = (diffVal / yesterdayVal) * 100。正值表示夜小上升(漏损恶化)，负值表示下降',
    tech: '前端计算', input: 'todayVal + yesterdayVal', output: 'diffVal + ratio + isAlarm',
    frequency: '每次数据加载后', method: 'compute in getList()', file: 'admin/src/views/data-integration/night-flow/index.vue',
    active: true, count: '—',
  },
  {
    key: 'alarm_check', label: '报警判定', shortLabel: '报警判定',
    icon: BellFilled, color: '#EF4444',
    description: 'ratio 超过阈值(默认 >30%) 标记 isAlarm = true，卡片显示红色报警标签。点击可查看详情抽屉中的30天趋势和10天小时表',
    tech: '阈值比较', input: 'ratio + 阈值配置', output: 'isAlarm 布尔标记',
    frequency: '每次计算后', method: 'alarm threshold compare', file: 'admin/src/views/data-integration/night-flow/index.vue',
    active: false, count: '—',
  },
  {
    key: 'trend_drawer', label: '趋势详情展示', shortLabel: '趋势展示',
    icon: Setting, color: '#EC4899',
    description: '点击分区详情按钮 → drawer 中 ECharts 渲染30天夜间最小流量趋势图 + 10天小时数据表 + 最新测点数据 + 报警记录',
    tech: 'ECharts 5.x + Drawer', input: '30天/10天历史数据', output: '趋势图 + 小时表 + 报警记录',
    frequency: '点击详情时', method: 'handleDrawerOpen()', file: 'admin/src/views/data-integration/night-flow/index.vue',
    active: false, count: '—',
  },
]
const visibleCount = 18
const startIndex = ref(0)

// 定时器
let mainTimer = null
let drawerLatestTimer = null
let drawerAlarmTimer = null
let scrollTimeout = null

// 交互状态
const activeZone = ref(null)
const drawerVisible = ref(false)
const drawerLoading = ref(false)

// 抽屉图表实例
let chart30Day = null
let chart10Day = null

// 抽屉数据
const latestDataList = ref([])
const alarmList = ref([])

// DOM 引用
const listContainer = ref(null)

// 地图相关
const mapContainer = ref(null)
const { map: mapInstance, AMap: AMapNS, init: initMapFn, destroy: destroyMap } = useAMap({
  plugins: ['AMap.Polygon', 'AMap.Marker'],
})
const noMapKey = ref(false)
let markers = []
let currentPolygon = null

const totalHeight = computed(() => renderData.value.length * itemHeight)
const offsetTop = computed(() => {
  const start = Math.max(0, startIndex.value - 5)
  return start * itemHeight
})
const visibleData = computed(() => {
  const start = Math.max(0, startIndex.value - 5)
  const end = Math.min(renderData.value.length, startIndex.value + visibleCount + 5)
  return renderData.value.slice(start, end)
})
const drawerTitle = computed(() => activeZone.value ? `分区详情 - ${activeZone.value.zoneName}` : '分区详情')

onMounted(async () => {
  await initMapKey()
  initData()
})

onBeforeUnmount(() => {
  clearAllTimers()
  if (chart30Day) chart30Day.dispose()
  if (chart10Day) chart10Day.dispose()
  if (mapInstance.value) mapInstance.value.destroy()
  window.removeEventListener('resize', handleResize)
})

async function initMap() {
  try {
    await initMapFn(mapContainer.value)
  } catch {
    noMapKey.value = true
  }
}

// 在地图上绘制分区边界或打点
function renderZoneOnMap(zone) {
  if (!mapInstance.value || !zone) return
  
  const AMap = window.AMap
  if (!AMap) return

  // 清除旧的图形
  if (currentPolygon) {
    mapInstance.value.remove(currentPolygon)
    currentPolygon = null
  }
  markers.forEach(m => mapInstance.value.remove(m))
  markers = []

  // 模拟：实际生产环境应该从 zone 数据中读取 coordinates/geojson
  // 这里我们生成一个基于中心点的虚拟多边形或标记
  const lng = zone.lng || (118.6 + (Math.random() - 0.5) * 0.1)
  const lat = zone.lat || (24.9 + (Math.random() - 0.5) * 0.1)
  
  // 添加中心点标记
  const marker = new AMap.Marker({
    position: [lng, lat],
    title: zone.zoneName
  })
  mapInstance.value.add(marker)
  markers.push(marker)

  // 平滑缩放定位
  mapInstance.value.setZoomAndCenter(14, [lng, lat], false, 1000)
}

async function initData() {
  try {
    const res = await listZoneTree({ name: searchQuery.value || undefined })
    if (res.code === 200 && res.data) {
      flatData.value = flattenTree(res.data, 1)
      updateRenderData()
      
      nextTick(() => {
        if (listContainer.value) listContainer.value.scrollTop = 0
        startIndex.value = 0
        fetchVisibleData()
      })
      
      clearInterval(mainTimer)
      mainTimer = setInterval(() => {
        fetchVisibleData()
      }, 5 * 60 * 1000)
    }
  } catch (error) {
    console.error('获取分区树失败', error)
  }
}

function flattenTree(tree, level) {
  let result = []
  tree.forEach(node => {
    const hasChildren = node.hasChildren || (node.children && node.children.length > 0)
    const existingNode = flatData.value.find(item => item.zoneCode === node.code)
    
    const item = {
      ...node,
      zoneCode: node.code,
      zoneName: node.name,
      level,
      hasChildren,
      expanded: existingNode ? existingNode.expanded : (level <= 2),
      loadedChildren: existingNode ? existingNode.loadedChildren : !!(node.children && node.children.length > 0),
      todayVal: existingNode ? existingNode.todayVal : null,
      yesterdayVal: existingNode ? existingNode.yesterdayVal : null,
      diffVal: existingNode ? existingNode.diffVal : null,
      ratio: existingNode ? existingNode.ratio : null,
      isFocus: existingNode ? existingNode.isFocus : false
    }
    result.push(item)
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenTree(node.children, level + 1))
    }
  })
  return result
}

function handleSearch() {
  flatData.value = []
  initData()
}

function updateRenderData() {
  const renderList = []
  let skipLevel = -1
  for (const item of flatData.value) {
    if (skipLevel !== -1 && item.level > skipLevel) {
      continue
    } else {
      skipLevel = -1
    }
    
    renderList.push(item)
    if (item.hasChildren && !item.expanded) {
      skipLevel = item.level
    }
  }
  renderData.value = renderList
}

function handleScroll() {
  if (!listContainer.value) return
  const scrollTop = listContainer.value.scrollTop
  startIndex.value = Math.floor(scrollTop / itemHeight)

  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    fetchVisibleData()
  }, 120)
}

async function fetchVisibleData() {
  const currentVisible = visibleData.value
  if (currentVisible.length === 0) return
  
  const zoneCodes = currentVisible.map(item => item.zoneCode).join(',')
  
  try {
    const res = await request({
      url: '/data-integration/query/zone-night-flow/batch',
      method: 'get',
      params: { zoneCodes }
    })
    
    if (res.code === 200 && res.data) {
      res.data.forEach(flowData => {
        const target = flatData.value.find(item => item.zoneCode === flowData.zoneCode)
        if (target) {
          target.todayVal = flowData.todayVal
          target.yesterdayVal = flowData.yesterdayVal
          target.diffVal = flowData.diffVal
          target.ratio = flowData.ratio
        }
      })
    }
  } catch (error) {
    console.error('获取分区流量数据失败', error)
  }
}

async function toggleExpand(item) {
  if (!item.expanded && item.hasChildren && !item.loadedChildren) {
    try {
      const res = await lazyZoneChildren(item.zoneCode, { name: searchQuery.value || undefined })
      if (res.code === 200 && res.data) {
        const newChildren = flattenTree(res.data, item.level + 1)
        const index = flatData.value.findIndex(i => i.zoneCode === item.zoneCode)
        if (index !== -1) {
          flatData.value.splice(index + 1, 0, ...newChildren)
        }
        item.loadedChildren = true
      }
    } catch (error) {
      console.error('懒加载子节点失败', error)
    }
  }
  
  item.expanded = !item.expanded
  updateRenderData()
  nextTick(() => {
    fetchVisibleData()
  })
}

function handleRowClick(item) {
  activeZone.value = item
  flatData.value.forEach(i => { i.isFocus = false })
  item.isFocus = true
  
  if (item.hasChildren) {
    toggleExpand(item)
  }
  
  // 联动地图定位
  renderZoneOnMap(item)
}

function openDrawer(item) {
  activeZone.value = item
  flatData.value.forEach(i => { i.isFocus = false })
  item.isFocus = true
  drawerVisible.value = true
}

function handleDrawerOpen() {
  drawerLoading.value = true
}

function handleDrawerOpened() {
  initCharts()
  fetchChartData()
  refreshLatestData()
  refreshAlarmData()
  
  drawerLatestTimer = setInterval(refreshLatestData, 30 * 1000)
  drawerAlarmTimer = setInterval(refreshAlarmData, 15 * 1000)
}

async function fetchChartData() {
  if (!activeZone.value || !activeZone.value.zoneCode) {
    drawerLoading.value = false
    return
  }
  
  try {
    const [res30Day, res10Day] = await Promise.all([
      request({
        url: '/data-integration/query/zone-night-flow/trend',
        method: 'get',
        params: { zoneCode: activeZone.value.zoneCode }
      }),
      request({
        url: '/data-integration/query/zone-hourly/trend',
        method: 'get',
        params: { zoneCode: activeZone.value.zoneCode }
      })
    ])
    
    if (res30Day.code === 200 && res30Day.data) {
      render30DayChart(res30Day.data)
    } else {
      render30DayChart([])
    }
    
    if (res10Day.code === 200 && res10Day.data) {
      render10DayChart(res10Day.data)
    } else {
      render10DayChart([])
    }
  } catch (error) {
    console.error('获取图表数据失败', error)
    render30DayChart([])
    render10DayChart([])
  } finally {
    drawerLoading.value = false
  }
}

function handleDrawerClose() {
  clearInterval(drawerLatestTimer)
  clearInterval(drawerAlarmTimer)
  if (chart30Day) {
    chart30Day.dispose()
    chart30Day = null
  }
  if (chart10Day) {
    chart10Day.dispose()
    chart10Day = null
  }
  window.removeEventListener('resize', handleResize)
}

function initCharts() {
  const dom30 = document.getElementById('chart-30day')
  const dom10 = document.getElementById('chart-10day')
  if (dom30) chart30Day = echarts.init(dom30)
  if (dom10) chart10Day = echarts.init(dom10)
  
  window.addEventListener('resize', handleResize)
}

function handleResize() {
  if (chart30Day) chart30Day.resize()
  if (chart10Day) chart10Day.resize()
}

function render30DayChart(dataList) {
  if (!chart30Day) return
  
  const option = {
    title: {
      show: dataList.length === 0,
      text: '暂无数据',
      left: 'center',
      top: 'center',
      textStyle: { color: '#909399', fontSize: 14, fontWeight: 'normal' }
    },
    tooltip: { 
      trigger: 'axis',
      axisPointer: { type: 'line' }
    },
    grid: { top: 30, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: dataList.map(item => item.date || ''),
      axisLine: { lineStyle: { color: '#DCDFE6' } },
      axisLabel: { color: '#606266' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { type: 'dashed', color: '#E4E7ED' } }
    },
    series: [
      {
        name: '夜间最小流量',
        data: dataList.map(item => item.value !== null ? item.value : 0),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.3)' },
            { offset: 1, color: 'rgba(64,158,255,0.05)' }
          ])
        }
      }
    ]
  }
  chart30Day.setOption(option, true)
}

function render10DayChart(dataList) {
  if (!chart10Day) return
  
  const option = {
    title: {
      show: dataList.length === 0,
      text: '暂无数据',
      left: 'center',
      top: 'center',
      textStyle: { color: '#909399', fontSize: 14, fontWeight: 'normal' }
    },
    tooltip: { 
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: { top: 30, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: dataList.map(item => item.time || ''),
      axisLine: { lineStyle: { color: '#DCDFE6' } },
      axisLabel: { color: '#606266' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { type: 'dashed', color: '#E4E7ED' } }
    },
    series: [
      {
        name: '供水量',
        data: dataList.map(item => item.value !== null ? item.value : 0),
        type: 'bar',
        itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 30
      }
    ]
  }
  chart10Day.setOption(option, true)
}

async function refreshLatestData() {
  if (!activeZone.value || !activeZone.value.zoneCode) return
  try {
    const res = await request({
      url: '/data-integration/query/zone-points/latest',
      method: 'get',
      params: { zoneCode: activeZone.value.zoneCode }
    })
    if (res.code === 200 && res.data) {
      latestDataList.value = res.data
    } else {
      latestDataList.value = []
    }
  } catch (error) {
    console.error('获取测点最新数据失败', error)
    latestDataList.value = []
  }
}

async function refreshAlarmData() {
  if (!activeZone.value || !activeZone.value.zoneCode) return
  try {
    const res = await request({
      url: '/data-integration/query/zone-alarms',
      method: 'get',
      params: { zoneCode: activeZone.value.zoneCode }
    })
    if (res.code === 200 && res.data) {
      alarmList.value = res.data
    } else {
      alarmList.value = []
    }
  } catch (error) {
    console.error('获取报警数据失败', error)
    alarmList.value = []
  }
}

function clearAllTimers() {
  clearInterval(mainTimer)
  clearInterval(drawerLatestTimer)
  clearInterval(drawerAlarmTimer)
  clearTimeout(scrollTimeout)
}

function formatVal(val) {
  return val !== null && val !== undefined ? val : '--'
}

function getTrendClass(val) {
  if (val === null || val === undefined || val === 0) return ''
  return val > 0 ? 'trend-up' : 'trend-down'
}

function getTrendIcon(val) {
  if (val === null || val === undefined || val === 0) return ''
  return val > 0 ? 'el-icon-top' : 'el-icon-bottom'
}
</script>

<style lang="scss" scoped>
.night-flow-container {
  display: flex;
  height: calc(100vh - 84px);
  padding: 0;
  margin: 0;
  overflow: hidden;
  background-color: #f0f2f5;

  .left-panel {
    width: 50%;
    min-width: 500px;
    height: 100%;
    background: #fff;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #ebeef5;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
    z-index: 10;
    
    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #ebeef5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      .title {
        font-size: 16px;
        font-weight: bold;
        color: #303133;
      }
      .search-bar {
        width: 250px;
      }
    }
    
    .list-container {
      flex: 1;
      overflow-y: auto;
      position: relative;
      
      .list-phantom {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        z-index: -1;
      }
      
      .list-inner {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
      }
    }
  }
  
  .right-panel {
    flex: 1;
    position: relative;
    background: #e4e7ed;
    
    .map-container {
      width: 100%;
      height: 100%;
      position: relative;
      background-color: #e5e3df; /* 高德地图加载前的底色 */
    }
    
    .map-placeholder {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, #f5f7fa 0%, #e4e7ed 100%);
      z-index: 10;
      
      .map-content {
        text-align: center;
        color: #606266;
        padding: 40px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 8px;
        box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
      }
    }
    
    /* 添加地图悬浮操作面板 */
    .map-toolbar {
      position: absolute;
      top: 20px;
      right: 20px;
      background: white;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      z-index: 99;
      display: flex;
      gap: 10px;
      
      .tool-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 4px;
        border: 1px solid #dcdfe6;
        cursor: pointer;
        color: #606266;
        background: white;
        transition: all 0.3s;
        
        &:hover {
          color: #409eff;
          border-color: #c6e2ff;
          background-color: #ecf5ff;
        }
      }
    }
  }
}

// 卡片样式
.zone-card {
  box-sizing: border-box;
  height: 76px;
  margin: 6px 12px;
  padding: 10px 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
    border-color: #c0c4cc;
  }
  
  &.is-focus {
    border-left: 4px solid #409EFF;
  }
  
  &.is-alarm {
    border-color: #f56c6c;
    background-color: #fef0f0;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    .zone-info {
      display: flex;
      align-items: center;
      transition: padding-left 0.2s;
      
      .expand-toggle {
        width: 0;
        height: 0;
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
        border-left: 6px solid #909399;
        margin-right: 10px;
        transition: transform 0.2s, border-left-color 0.2s;
        cursor: pointer;
      }
      
      .expand-toggle.is-expanded {
        transform: rotate(90deg);
        border-left-color: #409EFF;
      }
      
      .expand-toggle.invisible {
        visibility: hidden;
      }
      
      .level-badge {
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 4px;
        margin-right: 8px;
        font-weight: bold;
        
        &.level-1 { background: #ecf5ff; color: #409EFF; }
        &.level-2 { background: #f0f9eb; color: #67C23A; }
        &.level-3 { background: #fdf6ec; color: #E6A23C; }
        &.level-4 { background: #f4f4f5; color: #909399; }
      }
      
      .zone-name {
        font-size: 14px;
        font-weight: bold;
        color: #303133;
      }
    }
  }
  
  .card-body {
    .data-row {
      display: flex;
      justify-content: space-between;
      
      .data-item {
        display: flex;
        flex-direction: column;
        
        .label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }
        
        .value {
          font-size: 13px;
          font-weight: bold;
          color: #303133;
          
          &.trend-up {
            color: #f56c6c;
          }
          
          &.trend-down {
            color: #67c23a;
          }
        }
      }
    }
  }
}

// 抽屉内部样式
.night-flow-drawer {
  ::v-deep .el-drawer__body {
    padding: 0;
    overflow: hidden;
  }
  
  .drawer-content {
    height: 100%;
    padding: 20px;
    overflow-y: auto;
    background-color: #f5f7fa;
    
    .drawer-row {
      margin-bottom: 20px;
      
      &.half-width-container {
        display: flex;
        justify-content: space-between;
        
        .drawer-col {
          width: calc(50% - 10px);
        }
      }
    }
    
    .box-card {
      ::v-deep .el-card__header {
        padding: 12px 20px;
        font-weight: bold;
        background-color: #fafafa;
      }
      
      ::v-deep .el-card__body {
        padding: 16px;
      }
    }
    
    .chart-container {
      height: 250px;
    }
    
    .value-highlight {
      font-weight: bold;
      color: #409EFF;
    }
  }
}
</style>
