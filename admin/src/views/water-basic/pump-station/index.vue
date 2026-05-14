<template>
  <div class="pump-monitor">
    <!-- 概要统计 -->
    <div class="overview-bar">
      <div class="ov-item"><span class="ov-label">泵站总数</span><span class="ov-value">{{ summary.total }}</span></div>
      <div class="ov-item"><span class="ov-label">在线</span><span class="ov-value good">{{ summary.online }}</span></div>
      <div class="ov-item"><span class="ov-label">离线</span><span class="ov-value bad">{{ summary.offline }}</span></div>
      <div class="ov-item"><span class="ov-label">在线率</span><span class="ov-value" :class="Number(summary.onlineRate)>=80?'good':'warn'">{{ summary.onlineRate }}%</span></div>
    </div>

    <!-- 搜索 + 泵站网格 -->
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索泵站名称、编码、负责人" clearable size="default" style="width:320px" @clear="search" @keyup.enter="search">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>

    <div v-loading="loading">
      <div class="station-grid" v-if="stations.length > 0">
        <div v-for="s in stations" :key="s.code" class="station-card"
          :class="{ offline: s.iotStatus === '0' }"
          @click="selectStation(s)">
          <div class="sc-header">
            <span class="sc-name">{{ s.name }}</span>
            <span class="sc-status" :class="s.iotStatus === '1' ? 'online' : 'offline'">
              {{ s.iotStatus === '1' ? '在线' : '离线' }}
            </span>
          </div>
          <div class="sc-body">
            <div class="sc-info">
              <span class="sc-label">类型</span><span class="sc-val">{{ s.typeLabel }}</span>
            </div>
            <div class="sc-info">
              <span class="sc-label">编码</span><span class="sc-val mono">{{ s.code }}</span>
            </div>
            <div class="sc-info">
              <span class="sc-label">分区</span><span class="sc-val">{{ s.zoneCode || '--' }}</span>
            </div>
            <div class="sc-info">
              <span class="sc-label">设计能力</span><span class="sc-val">{{ s.designCapacity || '--' }}</span>
            </div>
          </div>
          <div class="sc-footer">
            <span class="sc-manager">{{ s.managerName || '无负责人' }}</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
      <div v-else class="empty-hint">暂无泵站数据</div>
    </div>

    <!-- 分页 -->
    <div class="pagination-box" v-if="summary.total > 0">
      <el-pagination
        v-model:current-page="pageNum"
        :page-size="pageSize"
        :total="summary.total"
        layout="total, prev, pager, next"
        @current-change="fetchData"
      />
    </div>

    <!-- 泵站详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="detailStation?.name" width="600px">
      <div v-if="detailStation" class="station-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="编码">{{ detailStation.code }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ detailStation.typeLabel }}</el-descriptions-item>
          <el-descriptions-item label="运行状态">
            <el-tag :type="detailStation.iotStatus==='1'?'success':'danger'">{{ detailStation.iotStatus==='1'?'在线':'离线' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设计能力">{{ detailStation.designCapacity || '--' }}</el-descriptions-item>
          <el-descriptions-item label="所属分区">{{ detailStation.zoneCode || '--' }}</el-descriptions-item>
          <el-descriptions-item label="地址">{{ detailStation.address || '--' }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ detailStation.managerName || '--' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detailStation.managerPhone || '--' }}</el-descriptions-item>
          <el-descriptions-item label="投产日期" v-if="detailStation.commissioningDate">{{ formatDate(detailStation.commissioningDate) }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin-top:16px" v-if="detailPoints.length > 0">
          <h4 style="font-size:14px;color:#0F172A;margin-bottom:8px">关联测点 ({{ detailPoints.length }})</h4>
          <el-table :data="detailPoints" size="small">
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="code" label="编码" />
            <el-table-column prop="type" label="类型" width="120" />
            <el-table-column prop="unit" label="单位" width="80" />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ArrowRight, Search } from '@element-plus/icons-vue'
import request from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(20)
const stations = ref([])
const summary = ref({ total: 0, online: 0, offline: 0, onlineRate: '0' })

const detailVisible = ref(false)
const detailStation = ref(null)
const detailPoints = ref([])

const formatDate = (t) => t ? dayjs(t).format('YYYY-MM-DD') : '--'

function fetchData() {
  loading.value = true
  request({
    url: '/water-basic/pump-station/list',
    method: 'get',
    params: { pageNum: pageNum.value, pageSize: pageSize.value, keyword: keyword.value || undefined },
  }).then(res => {
    if (res.data) {
      summary.value = res.data.summary || summary.value
      stations.value = res.data.stations || []
    }
  }).finally(() => { loading.value = false })
}

function search() {
  pageNum.value = 1
  fetchData()
}

function selectStation(s) {
  detailStation.value = null
  detailPoints.value = []
  detailVisible.value = true
  request({ url: '/water-basic/pump-station/detail', method: 'get', params: { stationCode: s.code } }).then(res => {
    if (res.data) {
      detailStation.value = res.data.station
      detailPoints.value = res.data.points || []
    }
  })
}

onMounted(() => { fetchData() })
</script>

<style lang="scss" scoped>
.pump-monitor { padding: 20px 24px; }

.overview-bar {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px;
}
.ov-item {
  background: #FFF; border-radius: 10px; padding: 16px 20px; border: 1px solid #E2E8F0;
  display: flex; justify-content: space-between; align-items: center;
}
.ov-label { font-size: 13px; color: #64748B; }
.ov-value { font-size: 28px; font-weight: 700; color: #0F172A; }
.ov-value.good { color: #10B981; }
.ov-value.warn { color: #F59E0B; }
.ov-value.bad { color: #EF4444; }

.toolbar {
  display: flex; gap: 12px; margin-bottom: 16px;
}

.station-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;
}

.station-card {
  background: #FFF; border-radius: 10px; border: 1px solid #E2E8F0;
  padding: 16px; cursor: pointer; transition: all .2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.06); }
  &.offline { opacity: 0.7; }
}

.sc-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
}
.sc-name { font-size: 15px; font-weight: 600; color: #0F172A; }
.sc-status {
  font-size: 12px; padding: 2px 8px; border-radius: 10px;
  &.online { background: #D1FAE5; color: #065F46; }
  &.offline { background: #FEE2E2; color: #991B1B; }
}

.sc-body { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.sc-info { display: flex; flex-direction: column; }
.sc-label { font-size: 11px; color: #94A3B8; }
.sc-val { font-size: 13px; color: #475569; }
.sc-val.mono { font-family: monospace; font-size: 12px; }

.sc-footer {
  display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid #F1F5F9;
}
.sc-manager { font-size: 12px; color: #94A3B8; }

.pagination-box {
  display: flex; justify-content: center; margin-top: 24px;
}

.empty-hint { text-align: center; color: #94A3B8; padding: 60px 0; font-size: 14px; }
</style>
