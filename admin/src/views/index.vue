<template>
  <div class="iot-home">
    <!-- KPI 统计卡片 -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-icon" style="background: #E0F2FE;"><el-icon :size="22" color="#0284C7"><MapLocation /></el-icon></div>
        <div class="kpi-body">
          <span class="kpi-num">{{ stats.zoneCount ?? '--' }}</span>
          <span class="kpi-label">管理分区</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: #DCFCE7;"><el-icon :size="22" color="#16A34A"><OfficeBuilding /></el-icon></div>
        <div class="kpi-body">
          <span class="kpi-num">{{ stats.stationCount ?? '--' }}</span>
          <span class="kpi-label">站点设施</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: #E0F2FE;"><el-icon :size="22" color="#2563EB"><Cpu /></el-icon></div>
        <div class="kpi-body">
          <span class="kpi-num">{{ stats.deviceOnline ?? '--' }}<span class="kpi-total"> / {{ stats.deviceCount ?? '--' }}</span></span>
          <span class="kpi-label">在线设备</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: #FEF3C7;"><el-icon :size="22" color="#D97706"><Grid /></el-icon></div>
        <div class="kpi-body">
          <span class="kpi-num">{{ stats.pointCount ?? '--' }}</span>
          <span class="kpi-label">监测点位</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: #FEE2E2;"><el-icon :size="22" color="#DC2626"><BellFilled /></el-icon></div>
        <div class="kpi-body">
          <span class="kpi-num">{{ stats.alarmCount ?? '--' }}</span>
          <span class="kpi-label">今日报警</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: #F3E8FF;"><el-icon :size="22" color="#9333EA"><WarningFilled /></el-icon></div>
        <div class="kpi-body">
          <span class="kpi-num">{{ stats.unresolvedAlarmCount ?? '--' }}</span>
          <span class="kpi-label">待处理报警</span>
        </div>
      </div>
      <div class="kpi-card burst-card">
        <div class="kpi-icon" style="background: #FEE2E2;"><el-icon :size="22" color="#EF4444"><WarningFilled /></el-icon></div>
        <div class="kpi-body">
          <span class="kpi-num">{{ burstStats.highRiskCount ?? '--' }}</span>
          <span class="kpi-label">高风险分区</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background: #FEF3C7;"><el-icon :size="22" color="#F59E0B"><TrendCharts /></el-icon></div>
        <div class="kpi-body">
          <span class="kpi-num">{{ burstStats.totalEvents ?? '--' }}</span>
          <span class="kpi-label">爆管事件</span>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="14">
        <el-card class="iot-card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon :size="18"><TrendCharts /></el-icon><span>近7天报警趋势</span></div>
          </template>
          <div ref="alarmTrendRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card class="iot-card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon :size="18"><PieChart /></el-icon><span>今日报警级别分布</span></div>
          </template>
          <div ref="alarmPieRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 列表区 -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="14">
        <el-card class="iot-card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon :size="18"><List /></el-icon><span>最近报警</span></div>
          </template>
          <el-table :data="stats.recentAlarms || []" size="small" stripe>
            <el-table-column prop="alarmContent" label="报警内容" min-width="160" show-overflow-tooltip />
            <el-table-column prop="alarmSource" label="报警源" width="120" show-overflow-tooltip />
            <el-table-column prop="alarmLevel" label="级别" width="70">
              <template #default="{ row }">
                <el-tag :type="levelTag(row.alarmLevel)" size="small">{{ levelLabel(row.alarmLevel) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === '0' ? 'danger' : 'success'" size="small">{{ row.status === '0' ? '未处理' : row.status === '1' ? '已处理' : '已恢复' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="alarmTime" label="报警时间" width="160">
              <template #default="{ row }">{{ formatTime(row.alarmTime) }}</template>
            </el-table-column>
          </el-table>
          <div v-if="!stats.recentAlarms?.length" class="empty-hint">今日暂无报警</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card class="iot-card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon :size="18"><PieChart /></el-icon><span>分区类型分布</span></div>
          </template>
          <div ref="zoneTypeRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 爆管风险 + 服务状态 -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="14">
        <el-card class="iot-card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon :size="18"><WarningFilled /></el-icon><span>爆管风险分区</span>
              <span class="ws-dot" :class="{ on: wsConnected }" title="实时推送"></span>
            </div>
          </template>
          <el-table :data="burstRiskZones" size="small" stripe max-height="260">
            <el-table-column prop="zoneName" label="分区名称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="riskLevel" label="风险等级" width="90">
              <template #default="{ row }">
                <el-tag :type="row.riskLevel === 'high' ? 'danger' : row.riskLevel === 'medium' ? 'warning' : 'success'" size="small">
                  {{ row.riskLevel === 'high' ? '高' : row.riskLevel === 'medium' ? '中' : '低' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="maxConfidence" label="最大置信度" width="100">
              <template #default="{ row }">
                <span :style="{ color: row.maxConfidence >= 70 ? '#EF4444' : row.maxConfidence >= 50 ? '#F59E0B' : '#10B981', fontWeight: 600 }">
                  {{ row.maxConfidence }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="eventCount" label="事件数" width="70" />
          </el-table>
          <div v-if="burstRiskZones.length === 0" class="empty-hint">暂无数据，请先执行爆管分析</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card class="iot-card" shadow="never">
          <template #header>
            <div class="card-title"><el-icon :size="18"><Monitor /></el-icon><span>微服务状态</span></div>
          </template>
          <div class="service-grid">
            <div v-for="svc in services" :key="svc.name" class="service-item">
              <span class="service-dot" :class="svc.online ? 'online' : 'offline'"></span>
              <span class="service-name">{{ svc.name }}</span>
              <span class="service-port">{{ svc.port }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import {
  MapLocation, OfficeBuilding, Cpu, Grid, BellFilled, WarningFilled,
  TrendCharts, PieChart, List, Monitor
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import request from '@/utils/request'
import { useWebSocket } from '@/hooks/useWebSocket'
import { getRiskZones } from '@/api/water-basic/burst'
import dayjs from 'dayjs'

// WebSocket
const ws = useWebSocket({ autoConnect: true })
const wsConnected = ws.connected

const stats = ref({
  zoneCount: 0,
  stationCount: 0,
  deviceCount: 0,
  deviceOnline: 0,
  pointCount: 0,
  alarmCount: 0,
  unresolvedAlarmCount: 0,
  alarmByLevel: {},
  zoneByType: {},
  alarmTrend: [],
  recentAlarms: [],
})

const burstStats = ref({ highRiskCount: 0, totalEvents: 0 })
const burstRiskZones = ref([])

const services = ref([
  { name: 'API 网关', port: '8080', online: true },
  { name: '鉴权服务', port: '3001', online: true },
  { name: '系统服务', port: '3002', online: true },
  { name: '监控服务', port: '3003', online: true },
  { name: '文件服务', port: '3004', online: true },
  { name: '工具服务', port: '3005', online: true },
  { name: '水务台账', port: '3006', online: true },
  { name: '数据集成', port: '3007', online: true },
  { name: '报警中心', port: '3008', online: true },
])

const alarmTrendRef = ref(null)
const alarmPieRef = ref(null)
const zoneTypeRef = ref(null)

let trendChart = null
let pieChart = null
let zoneChart = null

// 工具函数
const levelLabel = (v) => ({ '1': '紧急', '2': '重要', '3': '次要', '4': '提示' }[v] || v)
const levelTag = (v) => ({ '1': 'danger', '2': 'warning', '3': 'info', '4': '' }[v] || '')
const formatTime = (t) => t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : ''
const zoneTypeLabel = (t) => ({ '1': '行政营业', '2': 'DMA漏损', '3': '控压高程', '4': '供水调度' }[t] || ('类型' + t))

function fetchStats() {
  request({ url: '/system/home/stats', method: 'get' }).then(res => {
    if (res.data) {
      stats.value = res.data
      nextTick(() => {
        renderTrendChart()
        renderPieChart()
        renderZoneTypeChart()
      })
    }
  }).catch(() => {})
}

function fetchBurstStats() {
  getRiskZones().then(res => {
    const zones = res.data || []
    burstRiskZones.value = zones.filter(z => z.riskLevel !== 'low').sort((a, b) => b.maxConfidence - a.maxConfidence)
    burstStats.value = {
      highRiskCount: zones.filter(z => z.riskLevel === 'high').length,
      totalEvents: zones.reduce((s, z) => s + (z.eventCount || 0), 0),
    }
    // 健康检测: 标记对应服务状态
    checkServiceHealth()
  }).catch(() => {})
}

function checkServiceHealth() {
  // 通过 API 调用来检测服务是否在线
  const endpoints = [
    { name: '鉴权服务', port: '3001', url: '/auth' },
    { name: '系统服务', port: '3002', url: '/system/home/stats' },
    { name: '水务台账', port: '3006', url: '/water-basic/burst/risk-zones' },
    { name: '数据集成', port: '3007', url: '/data-integration/query/latest-batch' },
    { name: '报警中心', port: '3008', url: '/alarm' },
  ]
  endpoints.forEach(ep => {
    request({ url: ep.url, method: 'get', timeout: 3000 }).then(() => {
      const svc = services.value.find(s => s.name === ep.name)
      if (svc) svc.online = true
    }).catch(() => {
      const svc = services.value.find(s => s.name === ep.name)
      if (svc) svc.online = false
    })
  })
}

// WebSocket: 新爆管事件自动刷新
watch(() => ws.lastBurstEvent.value, () => {
  fetchBurstStats()
})

// WebSocket: 新报警自动刷新统计数据
watch(() => ws.lastAlarm.value, () => {
  fetchStats()
})

function renderTrendChart() {
  if (!alarmTrendRef.value) return
  if (!trendChart) trendChart = echarts.init(alarmTrendRef.value)
  const data = stats.value.alarmTrend || []
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date.slice(5)),
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontSize: 11 },
    },
    series: [{
      name: '报警数',
      type: 'line',
      data: data.map(d => d.count),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#EF4444', width: 2 },
      itemStyle: { color: '#EF4444' },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
        { offset: 1, color: 'rgba(239, 68, 68, 0.02)' },
      ])},
    }],
  }, true)
}

function renderPieChart() {
  if (!alarmPieRef.value) return
  if (!pieChart) pieChart = echarts.init(alarmPieRef.value)
  const byLevel = stats.value.alarmByLevel || {}
  const data = [
    { value: byLevel['1'] || 0, name: '紧急', itemStyle: { color: '#DC2626' } },
    { value: byLevel['2'] || 0, name: '重要', itemStyle: { color: '#F59E0B' } },
    { value: byLevel['3'] || 0, name: '次要', itemStyle: { color: '#3B82F6' } },
    { value: byLevel['4'] || 0, name: '提示', itemStyle: { color: '#94A3B8' } },
  ]
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '45%'],
      data,
      label: { fontSize: 11 },
      emphasis: { label: { fontSize: 14, fontWeight: 'bold' } },
    }],
  }, true)
}

function renderZoneTypeChart() {
  if (!zoneTypeRef.value) return
  if (!zoneChart) zoneChart = echarts.init(zoneTypeRef.value)
  const byType = stats.value.zoneByType || {}
  const data = Object.entries(byType).map(([k, v]) => ({ value: v, name: zoneTypeLabel(k) }))
  const colors = ['#0D9488', '#2563EB', '#D97706', '#9333EA', '#64748B']
  zoneChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '45%'],
      data: data.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } })),
      label: { fontSize: 11 },
    }],
  }, true)
}

// 窗口大小变化时重绘
function handleResize() {
  trendChart?.resize()
  pieChart?.resize()
  zoneChart?.resize()
}

onMounted(() => {
  document.title = '智慧水务 IoT 管理平台'
  fetchStats()
  fetchBurstStats()
  window.addEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.iot-home {
  min-height: calc(100vh - 84px);
  background: #F8FAFC;
  padding: 20px 24px 40px;
}

// KPI 卡片行
.kpi-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: #FFFFFF;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: default;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }
}

.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kpi-num {
  font-size: 24px;
  font-weight: 700;
  color: #0F172A;
  line-height: 1.2;
}

.kpi-total {
  font-size: 13px;
  font-weight: 400;
  color: #94A3B8;
}

.kpi-label {
  font-size: 12px;
  color: #64748B;
  margin-top: 2px;
}

// 图表区域
.iot-card {
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  margin-bottom: 20px;
}

.iot-card :deep(.el-card__header) {
  padding: 14px 20px 10px;
  border-bottom: 1px solid #F1F5F9;
  background: #FAFBFC;
}

.iot-card :deep(.el-card__body) {
  padding: 16px 20px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  .el-icon { color: #0D9488; }
}

.ws-dot {
  width: 8px; height: 8px; border-radius: 50%; margin-left: auto;
  background: #EF4444; transition: background 0.3s;
  &.on { background: #10B981; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
}

.chart-box {
  width: 100%;
  height: 260px;
}

// 服务网格
.service-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #F8FAFC;
  border-radius: 8px;
  font-size: 13px;
  transition: background 0.15s;
  &:hover { background: #F0FDFA; }
}

.service-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  &.online {
    background: #10B981;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
  }
  &.offline {
    background: #EF4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.12);
  }
}

.service-name {
  color: #334155;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.service-port {
  color: #94A3B8;
  font-family: 'JetBrains Mono','Fira Code','Courier New',monospace;
  font-size: 12px;
  flex-shrink: 0;
}

.empty-hint {
  text-align: center;
  color: #94A3B8;
  font-size: 13px;
  padding: 24px 0;
}

@media (max-width: 1200px) {
  .kpi-row { grid-template-columns: repeat(3, 1fr); }
  .service-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
  .service-grid { grid-template-columns: 1fr; }
  .iot-home { padding: 16px 12px 24px; }
}
</style>
