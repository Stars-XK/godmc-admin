<template>
  <div class="scada-page">
    <!-- 顶部状态栏 -->
    <div class="scada-topbar">
      <div class="scada-title">
        <el-icon :size="20"><Monitor /></el-icon>
        <span>SCADA 实时监控</span>
        <el-tag :type="connected ? 'success' : 'danger'" size="small" style="margin-left:12px">
          {{ connected ? '运行中' : '已断开' }}
        </el-tag>
      </div>
      <div class="scada-actions">
        <span class="refresh-timer">自动刷新 {{ countdown }}s</span>
        <el-switch v-model="autoRefresh" active-text="自动" size="small" />
        <el-button size="small" :icon="Refresh" @click="fetchAll" :loading="loading">刷新</el-button>
        <span class="update-time">最后更新: {{ lastUpdate || '--' }}</span>
      </div>
    </div>

    <!-- 设备统计 -->
    <div class="stats-row">
      <div class="stat-card" v-for="s in statCards" :key="s.label">
        <div class="stat-icon" :style="{ background: s.bg }"><el-icon :size="20" :color="s.color"><component :is="s.icon" /></el-icon></div>
        <div class="stat-body"><span class="stat-val" :style="{ color: s.color }">{{ s.value }}</span><span class="stat-label">{{ s.label }}</span></div>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- 站点状态表 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="s-card">
          <template #header><div class="card-title"><el-icon><OfficeBuilding /></el-icon><span>站点运行状态</span></div></template>
          <el-table :data="stations" size="small" v-loading="loading" max-height="400" stripe>
            <el-table-column prop="name" label="站点名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="typeLabel" label="类型" width="90" />
            <el-table-column prop="iotStatus" label="状态" width="80">
              <template #default="{ row }">
                <span class="dot" :class="row.iotStatus === '1' ? 'online' : 'offline'"></span>
                {{ row.iotStatus === '1' ? '在线' : '离线' }}
              </template>
            </el-table-column>
            <el-table-column prop="zoneCode" label="分区" width="100" show-overflow-tooltip />
            <el-table-column prop="managerName" label="负责人" width="90" />
            <el-table-column prop="address" label="地址" min-width="150" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>

      <!-- 最近报警 -->
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="s-card">
          <template #header><div class="card-title"><el-icon><BellFilled /></el-icon><span>实时报警</span><el-tag size="small" type="danger" style="margin-left:8px">{{ alarms.length }}</el-tag></div></template>
          <div class="alarm-list" v-if="alarms.length > 0">
            <div v-for="a in alarms" :key="a.alarmId" class="alarm-row" :class="'level-' + a.alarmLevel">
              <div class="alarm-level">
                <el-tag :type="levelTag(a.alarmLevel)" size="small">{{ levelLabel(a.alarmLevel) }}</el-tag>
              </div>
              <div class="alarm-body">
                <div class="alarm-content">{{ a.alarmContent }}</div>
                <div class="alarm-meta">
                  <span>{{ a.alarmSource }}</span>
                  <span>{{ formatTime(a.alarmTime) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-hint">暂无报警</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Monitor, OfficeBuilding, BellFilled, Refresh, Setting, Cpu, Grid } from '@element-plus/icons-vue'
import request from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const connected = ref(true)
const autoRefresh = ref(true)
const countdown = ref(30)
const lastUpdate = ref('')

const stationCount = ref(0)
const deviceCount = ref(0)
const onlineCount = ref(0)
const alarmCount = ref(0)
const stations = ref([])
const alarms = ref([])

let timer = null
let countdownTimer = null

const statCards = computed(() => [
  { label: '站点总数', value: stationCount.value, icon: 'OfficeBuilding', color: '#0D9488', bg: '#CCFBF1' },
  { label: '设备总数', value: deviceCount.value, icon: 'Cpu', color: '#2563EB', bg: '#DBEAFE' },
  { label: '在线设备', value: onlineCount.value, icon: 'Setting', color: '#10B981', bg: '#D1FAE5' },
  { label: '报警数量', value: alarmCount.value, icon: 'BellFilled', color: '#EF4444', bg: '#FEE2E2' },
])

const levelLabel = (v) => ({ '1': '紧急', '2': '重要', '3': '次要', '4': '提示' }[v] || v)
const levelTag = (v) => ({ '1': 'danger', '2': 'warning', '3': 'info', '4': '' }[v] || '')
const formatTime = (t) => t ? dayjs(t).format('MM-DD HH:mm:ss') : ''

function fetchAll() {
  loading.value = true
  Promise.all([
    request({ url: '/water-basic/pump-station/list', method: 'get' }),
    request({ url: '/alarm/history/list', method: 'get', params: { pageNum: 1, pageSize: 10, status: '0' } }),
    request({ url: '/system/home/stats', method: 'get' }),
  ]).then(([stationRes, alarmRes, statsRes]) => {
    if (stationRes.data) {
      stations.value = stationRes.data.stations || []
      stationCount.value = stationRes.data.summary?.total || stations.value.length
      onlineCount.value = stationRes.data.summary?.online || 0
    }
    if (alarmRes.data) {
      alarms.value = alarmRes.data.rows || []
      alarmCount.value = alarms.value.length
    }
    if (statsRes.data) {
      deviceCount.value = statsRes.data.deviceCount || 0
    }
    lastUpdate.value = dayjs().format('HH:mm:ss')
    countdown.value = 30
  }).catch(() => {
    connected.value = false
  }).finally(() => { loading.value = false })
}

onMounted(() => {
  fetchAll()
  timer = setInterval(() => {
    if (autoRefresh.value) fetchAll()
  }, 30000)
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) countdown.value--
    else countdown.value = 30
  }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(timer)
  clearInterval(countdownTimer)
})
</script>

<style lang="scss" scoped>
.scada-page {
  padding: 16px 24px;
  min-height: calc(100vh - 84px);
  background: #0F172A;
  color: #E2E8F0;
}

.scada-topbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px; background: #1E293B; border-radius: 8px; margin-bottom: 16px;
}
.scada-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; font-weight: 700; color: #F1F5F9;
}
.scada-actions {
  display: flex; align-items: center; gap: 12px;
  font-size: 13px; color: #94A3B8;
}
.refresh-timer { min-width: 80px; text-align: right; font-family: monospace; }
.update-time { font-size: 12px; color: #64748B; }

.stats-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;
}
.stat-card {
  display: flex; align-items: center; gap: 12px;
  background: #1E293B; border-radius: 8px; padding: 14px 16px;
  border: 1px solid #334155;
}
.stat-icon {
  width: 40px; height: 40px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.stat-body { display: flex; flex-direction: column; }
.stat-val { font-size: 24px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 12px; color: #94A3B8; }

.s-card {
  background: #1E293B !important; border: 1px solid #334155 !important; border-radius: 8px;
  margin-bottom: 16px;
  :deep(.el-card__header) {
    background: #252F3F; border-bottom-color: #334155; padding: 10px 16px;
  }
  :deep(.el-card__body) { padding: 12px 16px; }
  :deep(.el-table) {
    --el-table-bg-color: transparent;
    --el-table-tr-bg-color: transparent;
    --el-table-header-bg-color: #252F3F;
    --el-table-border-color: #334155;
    --el-table-text-color: #CBD5E1;
    --el-table-header-text-color: #94A3B8;
    --el-table-row-hover-bg-color: #1A2A3F;
  }
}

.card-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 600; color: #F1F5F9;
  .el-icon { color: #5EEAD4; }
}

.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 4px; }
.dot.online { background: #10B981; }
.dot.offline { background: #EF4444; }

.alarm-list { max-height: 400px; overflow-y: auto; }
.alarm-row {
  display: flex; gap: 10px; padding: 10px; border-radius: 6px; margin-bottom: 6px;
  background: #252F3F; border-left: 3px solid #334155;
  &.level-1 { border-left-color: #DC2626; background: rgba(220,38,38,0.08); }
  &.level-2 { border-left-color: #F59E0B; background: rgba(245,158,11,0.06); }
}
.alarm-level { flex-shrink: 0; }
.alarm-body { flex: 1; min-width: 0; }
.alarm-content { font-size: 13px; color: #F1F5F9; margin-bottom: 4px; }
.alarm-meta { font-size: 11px; color: #64748B; display: flex; justify-content: space-between; }

.empty-hint { text-align: center; color: #64748B; font-size: 13px; padding: 24px 0; }

@media (max-width: 992px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
</style>
