<template>
  <div class="data-viewer-container">
    <!-- 站点视图 -->
    <div v-if="viewType === 'station'" class="station-view">
      <div class="view-header">
        <div class="header-left">
          <h3>{{ name || code }} - 下属设备实时数据</h3>
        </div>
        <el-button type="primary" link icon="Refresh" @click="fetchStationData">刷新</el-button>
      </div>
      <div v-loading="loading" class="station-device-list">
        <div v-for="device in stationDevices" :key="device.code" class="device-section">
          <h4 class="device-title">
            <el-icon><Cpu /></el-icon> {{ device.name }} ({{ device.code }})
          </h4>
          <el-row :gutter="20">
            <el-col :span="12" :md="8" :lg="6" v-for="(item, index) in device.latestData" :key="index" style="margin-bottom: 20px;">
              <el-card shadow="hover" class="point-card">
                <div class="point-title" :title="item.pointCode">{{ item.pointCode }}</div>
                <div class="point-value">{{ item.val }}</div>
                <div class="point-time">{{ formatTime(item.ts) }}</div>
              </el-card>
            </el-col>
            <el-col :span="24" v-if="!device.latestData || device.latestData.length === 0">
              <el-empty description="暂无感知数据" :image-size="60"></el-empty>
            </el-col>
          </el-row>
        </div>
        <el-empty v-if="stationDevices.length === 0 && !loading" description="该站点下暂无设备"></el-empty>
      </div>
    </div>

    <!-- 设备视图 -->
    <div v-if="viewType === 'device'" class="device-view">
      <div class="view-header">
        <div class="header-left">
          <h3>{{ name || code }} - 实时感知数据</h3>
        </div>
        <el-button type="primary" link icon="Refresh" @click="fetchLatest">刷新</el-button>
      </div>
      <el-row :gutter="20" v-loading="loading">
        <el-col :span="12" :md="8" :lg="6" v-for="(item, index) in latestData" :key="index" style="margin-bottom: 20px;">
          <el-card shadow="hover" class="point-card">
            <div class="point-title" :title="item.pointCode">{{ item.pointCode }}</div>
            <div class="point-value">{{ item.val }}</div>
            <div class="point-time">{{ formatTime(item.ts) }}</div>
          </el-card>
        </el-col>
        <el-col :span="24" v-if="latestData.length === 0 && !loading">
          <el-empty description="暂无感知数据"></el-empty>
        </el-col>
      </el-row>
    </div>

    <!-- 测点视图 -->
    <div v-if="viewType === 'point'" class="point-view">
      <div class="view-header">
        <div class="header-left">
          <h3>{{ name || code }} - 历史数据曲线</h3>
        </div>
      </div>
      <div class="toolbar">
        <el-radio-group v-model="historyParams.interval" @change="fetchHistory" size="small">
          <el-radio-button label="raw">原始</el-radio-button>
          <el-radio-button label="5m">5分钟</el-radio-button>
          <el-radio-button label="1h">1小时</el-radio-button>
          <el-radio-button label="1d">日统计</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          @change="handleDateChange"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="margin-left: 15px;"
        />
        <el-button type="primary" size="small" icon="Refresh" style="margin-left: 15px;" @click="fetchHistory">刷新</el-button>
      </div>
      <div v-loading="loading" class="chart-box" ref="chartRef"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getLatestDataBatch, getHistoryData } from '@/api/data-integration/query'
import { listDevice } from '@/api/water-basic/equipment'
import * as echarts from 'echarts'

const props = defineProps({
  viewType: { type: String, required: true }, // 'station' | 'device' | 'point'
  code: { type: String, required: true },
  name: { type: String, default: '' },
  parentCode: { type: String, default: '' } // 仅测点需要 deviceCode
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
    
    // 对于每个设备，获取最新数据
    await Promise.all(devices.map(async (device) => {
      try {
        const latestRes = await getLatestDataBatch({ deviceCode: device.code })
        device.latestData = latestRes.data || []
      } catch (e) {
        device.latestData = []
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
    const res = await getLatestDataBatch({ deviceCode: props.code })
    latestData.value = res.data || []
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
      interval: historyParams.value.interval
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
  // 原始数据假定如果超过 30 分钟没有数据则认为断线，其他聚合按其粒度的 1.5 - 2 倍计算
  let gapThreshold = 30 * 60 * 1000 
  if (historyParams.value.interval === '5m') gapThreshold = 10 * 60 * 1000
  if (historyParams.value.interval === '1h') gapThreshold = 2 * 60 * 60 * 1000
  if (historyParams.value.interval === '1d') gapThreshold = 2 * 24 * 60 * 60 * 1000

  for (let i = 0; i < dataList.length; i++) {
    const currentTs = new Date(dataList[i].ts).getTime()
    
    // 如果不是第一个点，且与上一个点的时间差超过了阈值，插入一个包含 null 值的断点
    if (i > 0) {
      const prevTs = new Date(dataList[i - 1].ts).getTime()
      if (currentTs - prevTs > gapThreshold) {
        // 在前一个点之后 1 秒插入一个空点来强行断开
        seriesData.push([prevTs + 1000, null])
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
.data-viewer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.view-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}
.point-card {
  text-align: center;
  border-radius: 8px;
}
.point-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.point-value {
  font-size: 26px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}
.point-time {
  font-size: 12px;
  color: #C0C4CC;
}
.toolbar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.chart-box {
  width: 100%;
  height: 450px;
  flex-grow: 1;
}
.station-device-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding-right: 10px;
}
.device-section {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 20px;
}
.device-section:last-child {
  border-bottom: none;
}
.device-title {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
