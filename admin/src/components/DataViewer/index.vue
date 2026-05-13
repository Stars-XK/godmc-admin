<template>
  <div class="data-viewer-container">
    <!-- 站点视图 -->
    <div v-if="viewType === 'station'" class="station-view">
      <div class="view-header">
        <div class="header-title">
          <span class="header-accent"></span>
          <span class="header-label">下属设备实时数据</span>
          <el-tag size="small" effect="plain" type="info" class="header-tag">{{ stationDevices.length }} 台设备</el-tag>
        </div>
        <div class="header-subtitle">{{ name || code }}</div>
        <el-button class="refresh-btn" icon="Refresh" @click="fetchStationData">刷新</el-button>
      </div>
      <div v-loading="loading" class="station-device-list">
        <div v-for="device in stationDevices" :key="device.code" class="device-section">
          <div class="device-header">
            <div class="device-header-left">
              <span class="device-status-dot"></span>
              <span class="device-name">{{ device.name }}</span>
              <span class="device-code">{{ device.code }}</span>
            </div>
            <span class="device-point-count">{{ device.pointData ? device.pointData.length : 0 }} 个测点</span>
          </div>
          <div class="point-grid">
            <div v-for="(item, index) in device.pointData" :key="index" class="point-card" :class="{ 'point-no-data': item.val === '—' }">
              <div class="point-card-head">
                <span class="point-label" :title="item.pointName">{{ item.pointName }}</span>
                <span class="point-code" :title="item.pointCode">{{ item.pointCode }}</span>
              </div>
              <div class="point-card-body">
                <span class="point-value" :class="{ 'value-empty': item.val === '—' }">{{ item.val }}</span>
              </div>
              <div class="point-card-foot">
                <el-icon class="point-time-icon"><Clock /></el-icon>
                <span class="point-time">{{ item.ts ? formatTime(item.ts) : '暂无数据' }}</span>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-if="stationDevices.length === 0 && !loading" description="该站点下暂无设备" />
      </div>
    </div>

    <!-- 设备视图 -->
    <div v-if="viewType === 'device'" class="device-view">
      <div class="view-header">
        <div class="header-title">
          <span class="header-accent"></span>
          <span class="header-label">实时感知数据</span>
          <el-tag size="small" effect="plain" type="info" class="header-tag">{{ latestData.length }} 个测点</el-tag>
        </div>
        <div class="header-subtitle">{{ name || code }}</div>
        <el-button class="refresh-btn" icon="Refresh" @click="fetchLatest">刷新</el-button>
      </div>
      <div v-loading="loading" class="point-grid">
        <div v-for="(item, index) in latestData" :key="index" class="point-card" :class="{ 'point-no-data': item.val === '—' }">
          <div class="point-card-head">
            <span class="point-label" :title="item.pointName">{{ item.pointName }}</span>
            <span class="point-code" :title="item.pointCode">{{ item.pointCode }}</span>
          </div>
          <div class="point-card-body">
            <span class="point-value" :class="{ 'value-empty': item.val === '—' }">{{ item.val }}</span>
          </div>
          <div class="point-card-foot">
            <el-icon class="point-time-icon"><Clock /></el-icon>
            <span class="point-time">{{ item.ts ? formatTime(item.ts) : '暂无数据' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 测点视图 -->
    <div v-if="viewType === 'point'" class="point-view">
      <div class="view-header">
        <div class="header-title">
          <span class="header-accent"></span>
          <span class="header-label">历史数据曲线</span>
        </div>
        <div class="header-subtitle">{{ name || code }}</div>
      </div>
      <div class="chart-toolbar">
        <div class="toolbar-left">
          <span class="toolbar-section-label">聚合粒度</span>
          <el-radio-group v-model="historyParams.interval" @change="fetchHistory" size="small">
            <el-radio-button label="raw">原始</el-radio-button>
            <el-radio-button label="5m">5 分钟</el-radio-button>
            <el-radio-button label="1h">1 小时</el-radio-button>
            <el-radio-button label="1d">日统计</el-radio-button>
          </el-radio-group>
        </div>
        <div class="toolbar-right">
          <span class="toolbar-section-label">时间范围</span>
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            @change="handleDateChange"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
          <el-button type="primary" size="small" icon="Refresh" @click="fetchHistory">刷新</el-button>
        </div>
      </div>
      <div v-loading="loading" class="chart-wrapper">
        <div class="chart-box" ref="chartRef"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getLatestDataBatch, getHistoryData } from '@/api/data-integration/query'
import { listDevice, listPoint } from '@/api/water-basic/equipment'
import * as echarts from 'echarts'

const props = defineProps({
  viewType: { type: String, required: true }, // 'station' | 'device' | 'point'
  code: { type: String, required: true },
  name: { type: String, default: '' },
  parentCode: { type: String, default: '' }, // 仅测点需要 deviceCode
  pointType: { type: String, default: '' } // 新增测点类型(例如 FLOW, PRESSURE 等)
})

const loading = ref(false)
const stationDevices = ref([])
const latestData = ref([])
const dateRange = ref([])
const historyParams = ref({ interval: 'raw' })

const chartRef = ref(null)
let chartInstance = null

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => n < 10 ? '0' + n : n
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function initDateRange() {
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 3600 * 1000 * 24) // 默认 24 小时
  dateRange.value = [formatTime(start), formatTime(end)]
}

async function fetchStationData() {
  if (!props.code) return
  loading.value = true
  try {
    const res = await listDevice({ stationCode: props.code, pageNum: 1, pageSize: 100 })
    const devices = res.data.list || []

    await Promise.all(devices.map(async (device) => {
      try {
        const [pointRes, latestRes] = await Promise.all([
          listPoint({ deviceCode: device.code, pageNum: 1, pageSize: 500 }),
          getLatestDataBatch({ deviceCode: device.code })
        ])
        const points = pointRes.data.list || pointRes.data || []
        const latestMap = {}
        ;(latestRes.data || []).forEach(d => { latestMap[d.pointCode] = d })
        device.pointData = points.map(p => {
          const code = p.pointCode || p.code
          const latest = latestMap[code]
          return {
            pointCode: code,
            pointName: p.name || code,
            val: latest ? latest.val : '—',
            ts: latest ? latest.ts : null
          }
        })
      } catch (e) {
        device.pointData = []
      }
    }))
    stationDevices.value = devices
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function fetchLatest() {
  if (!props.code) return
  loading.value = true
  try {
    const [pointRes, latestRes] = await Promise.all([
      listPoint({ deviceCode: props.code, pageNum: 1, pageSize: 500 }),
      getLatestDataBatch({ deviceCode: props.code })
    ])
    const points = pointRes.data.list || pointRes.data || []
    const latestMap = {}
    ;(latestRes.data || []).forEach(d => { latestMap[d.pointCode] = d })
    latestData.value = points.map(p => {
      const code = p.pointCode || p.code
      const latest = latestMap[code]
      return {
        pointCode: code,
        pointName: p.name || code,
        val: latest ? latest.val : '—',
        ts: latest ? latest.ts : null
      }
    })
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleDateChange() {
  fetchHistory()
}

async function fetchHistory() {
  if (!props.code || !props.parentCode || !dateRange.value || dateRange.value.length < 2) return
  loading.value = true
  try {
    const res = await getHistoryData({
      deviceCode: props.parentCode,
      pointCode: props.code,
      startTime: dateRange.value[0],
      endTime: dateRange.value[1],
      interval: historyParams.value.interval,
      // 如果后端要求传 pointType（'instantaneous'|'cumulative'|'incremental'），
      // 目前没有在前端完全判断这个逻辑，先传 default，或者通过后端查表决定。
      // 因为后端 QueryController 中定义了 @Query('pointType')，并且必填。
      // 我们可以先传递 'instantaneous'，因为 TdengineAggService 中现在自动判断。
      // 注意：目前后端 QueryController 接口定义了 pointType 是必填参数，
      // 所以我们临时传一个默认值，后端在 1.2.4 更新中其实也可以通过字典自动处理。
      pointType: 'instantaneous'
    })
    renderChart(res.data || [])
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function renderChart(dataList) {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  // 转换数据为时间轴格式 [timestamp, value]
  // 动态判断数据断档，超过指定间隔则插入 null 断开连线
  const seriesData = []
  
  // 根据不同的时间粒度设置断开连线的阈值（毫秒）
  // 用户要求：原始数据>1小时断开，5分钟数据>5分钟断开，1小时数据>1小时断开，1天数据>1天断开。
  // 为了容忍微小的毫秒误差（例如插入时有几十毫秒延迟），加一点点容差缓冲。
  let gapThreshold = 60 * 60 * 1000 + 10000 // 默认 raw: 1小时 + 10秒容差
  if (historyParams.value.interval === '5m') gapThreshold = 5 * 60 * 1000 + 10000 // 5分钟 + 10秒容差
  if (historyParams.value.interval === '1h') gapThreshold = 60 * 60 * 1000 + 10000 // 1小时 + 10秒容差
  if (historyParams.value.interval === '1d') gapThreshold = 24 * 60 * 60 * 1000 + 10000 // 1天 + 10秒容差

  for (let i = 0; i < dataList.length; i++) {
    const currentTs = new Date(dataList[i].ts).getTime()
    
    // 如果不是第一个点，且与上一个点的时间差超过了阈值，插入一个包含 null 值的断点
    if (i > 0) {
      const prevTs = new Date(dataList[i - 1].ts).getTime()
      if (currentTs - prevTs > gapThreshold) {
        // 在前一个点之后插入一个空点来强行断开
        // 插入的时间点不重要，只要在两者之间即可，echarts 会自动断开连线
        seriesData.push([prevTs + 1, null])
      }
    }
    seriesData.push([currentTs, dataList[i].val])
  }

  // 固定 X 轴范围为用户选择的时间范围
  const startTime = new Date(dateRange.value[0]).getTime()
  const endTime = new Date(dateRange.value[1]).getTime()

  const option = {
    tooltip: { 
      trigger: 'axis',
      formatter: function (params) {
        const date = new Date(params[0].value[0])
        const timeStr = `${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes()}`
        return `${timeStr}<br/>${params[0].marker} ${params[0].seriesName} <b>${params[0].value[1]}</b>`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'time',
      min: startTime,
      max: endTime,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { color: '#606266' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } },
      axisLabel: { color: '#909399' }
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { start: 0, end: 100 }
    ],
    series: [
      {
        name: '监测数值',
        type: 'line',
        smooth: false, // 改为 false，避免插值平滑导致断点显示不明显
        connectNulls: false, // 确保断点不相连
        symbolSize: 6,
        data: seriesData,
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
  
  // 使用 notMerge 模式更新图表，防止旧数据残留
  chartInstance.setOption(option, true)
}

function handleResize() {
  if (chartInstance) chartInstance.resize()
}

watch(() => props.code, (newVal) => {
  if (newVal) {
    if (props.viewType === 'station') {
      fetchStationData()
    } else if (props.viewType === 'device') {
      fetchLatest()
    } else if (props.viewType === 'point') {
      if(dateRange.value.length === 0) initDateRange()
      nextTick(() => fetchHistory())
    }
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) chartInstance.dispose()
})
</script>

<style scoped>
/* ==========================================
   DataViewer — 数据查看器
   三层视图: 站点 → 设备 → 测点
   ========================================== */

.data-viewer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ---- View Header ---- */
.view-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: #F8FAFC;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  position: relative;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.header-accent {
  width: 4px;
  height: 20px;
  border-radius: 2px;
  background: #409EFF;
  flex-shrink: 0;
}

.header-label {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
  letter-spacing: 0.3px;
}

.header-tag {
  font-weight: 500;
}

.header-subtitle {
  font-size: 13px;
  color: #94A3B8;
  line-height: 32px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.refresh-btn {
  margin-left: auto;
  flex-shrink: 0;
  align-self: center;
}

/* ---- Point Grid ---- */
.point-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(172px, 1fr));
  gap: 14px;
}

/* ---- Point Card ---- */
.point-card {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color .2s, box-shadow .2s, transform .15s;
  cursor: default;
}

.point-card:hover {
  border-color: #409EFF40;
  box-shadow: 0 2px 12px rgba(64,158,255,.1);
  transform: translateY(-1px);
}

.point-card-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.point-label {
  font-size: 13px;
  color: #334155;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.point-code {
  font-size: 11px;
  color: #94A3B8;
  font-family: 'SF Mono', 'Consolas', 'Menlo', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.point-card-body {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.point-value {
  font-size: 28px;
  font-weight: 700;
  color: #1E293B;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.point-card-foot {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #CBD5E1;
  font-size: 11px;
}

.point-time-icon {
  font-size: 13px;
}

.point-time {
  color: #CBD5E1;
}

.point-empty {
  padding: 20px 0;
}

/* 无数据测点 */
.point-no-data {
  opacity: 0.6;
}
.point-no-data:hover {
  opacity: 0.85;
}
.value-empty {
  color: #CBD5E1 !important;
  font-size: 22px;
  font-weight: 400;
}

/* ---- Station View / Device Sections ---- */
.station-device-list {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding-right: 6px;
  overflow-y: auto;
  flex: 1;
}

.device-section {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 18px 20px 20px;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #E2E8F0;
}

.device-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.device-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #67C23A;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(103,194,58,.15);
}

.device-name {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-code {
  font-size: 12px;
  color: #94A3B8;
  font-family: 'SF Mono', 'Consolas', 'Menlo', monospace;
  background: #F1F5F9;
  padding: 2px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}

.device-point-count {
  font-size: 12px;
  color: #94A3B8;
  flex-shrink: 0;
}

/* ---- Chart ---- */
.chart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-section-label {
  font-size: 12px;
  color: #94A3B8;
  font-weight: 500;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.chart-wrapper {
  flex: 1;
  min-height: 0;
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 16px;
  display: flex;
}

.chart-box {
  width: 100%;
  height: 420px;
}
</style>
