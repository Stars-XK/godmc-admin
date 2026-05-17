<template>
  <div class="mobile-task-detail">
    <!-- 顶部 -->
    <div class="m-header">
      <span class="back-btn" @click="$router.back()"><el-icon><ArrowLeft /></el-icon></span>
      <span class="m-title">任务详情</span>
      <el-tag :type="statusTagType(task.taskStatus)" size="small">{{ statusMap[task.taskStatus] }}</el-tag>
    </div>

    <div class="detail-scroll" v-if="task.id">
      <!-- 任务信息 -->
      <div class="info-card">
        <h3>{{ task.taskName }}</h3>
        <p class="task-code">{{ task.taskCode }}</p>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">路线</span>
            <span class="info-val">{{ task.routeName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">截止</span>
            <span class="info-val" :class="{ overdue: isOverdue }">{{ fmtDate(task.deadline) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">进度</span>
            <span class="info-val">{{ task.completedCheckpoints || 0 }}/{{ task.totalCheckpoints || 0 }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">检查员</span>
            <span class="info-val">{{ task.assignedUserName || '-' }}</span>
          </div>
        </div>
        <!-- 进度条 -->
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill" :style="{ width: (task.completionRatio || 0) + '%' }"></div></div>
          <span>{{ task.completionRatio || 0 }}%</span>
        </div>
      </div>

      <!-- 检查点列表 -->
      <div class="section-title">检查点 ({{ checkpoints.length }})</div>
      <div class="checkpoint-list">
        <div
          v-for="(cp, i) in checkpoints"
          :key="cp.id"
          class="cp-card"
          :class="{ done: cp._done, current: i === currentCpIndex }"
          @click="openCheckpoint(cp, i)"
        >
          <div class="cp-num">{{ i + 1 }}</div>
          <div class="cp-info">
            <span class="cp-name">{{ cp.checkpointName }}</span>
            <span class="cp-type">{{ typeMap[cp.checkpointType] || cp.checkpointType }}</span>
          </div>
          <el-icon v-if="cp._done" class="cp-check" color="#10B981"><CircleCheckFilled /></el-icon>
          <el-icon v-else class="cp-arrow" color="#d1d5db"><ArrowRight /></el-icon>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <el-button
          v-if="task.taskStatus === 'pending'"
          type="primary"
          size="large"
          round
          class="action-btn"
          @click="acceptTask"
        >
          接受任务
        </el-button>
        <el-button
          v-if="task.taskStatus === 'accepted'"
          type="success"
          size="large"
          round
          class="action-btn"
          @click="startTask"
        >
          开始巡检
        </el-button>
        <el-button
          v-if="task.taskStatus === 'in_progress' && allDone"
          type="warning"
          size="large"
          round
          class="action-btn"
          @click="submitTask"
        >
          提交巡检结果
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, CircleCheckFilled } from '@element-plus/icons-vue'
import { getTask } from '@/api/inspection/task'
import { listCheckpoint } from '@/api/inspection/checkpoint'
import { listRecordByTask } from '@/api/inspection/record'

const route = useRoute()
const router = useRouter()
const task = ref({})
const checkpoints = ref([])
const currentCpIndex = ref(-1)

const statusMap = {
  pending: '待接收', accepted: '已接收', in_progress: '进行中',
  submitted: '已提交', reviewed: '已审核', closed: '已完成', overdue: '已超时',
}
const typeMap = { visual: '目视', meter_reading: '抄表', equipment: '设备', env: '环境', safety: '安全', other: '其他' }

const isOverdue = computed(() => task.value.deadline && new Date(task.value.deadline) < new Date())
const allDone = computed(() => checkpoints.value.length > 0 && checkpoints.value.every(cp => cp._done))

function statusTagType(s) {
  return { pending: 'info', accepted: '', in_progress: 'warning', submitted: '', reviewed: '', closed: 'success', overdue: 'danger' }[s] || 'info'
}

function fmtDate(d) {
  if (!d) return '-'
  const t = new Date(d)
  return `${t.getMonth() + 1}/${t.getDate()} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
}

async function loadDetail() {
  const taskId = route.params.taskId
  try {
    const res = await getTask(taskId)
    task.value = res.data || {}
    // 获取关联检查点
    const cpRes = await listCheckpoint({ pageNum: 1, pageSize: 99 })
    const allCps = cpRes.data?.list || cpRes.data || []
    // 获取已完成记录
    const recRes = await listRecordByTask(taskId)
    const records = recRes.data || []
    const doneIds = new Set(records.map(r => r.checkpointId))
    checkpoints.value = allCps.map(cp => ({ ...cp, _done: doneIds.has(cp.id) }))
  } catch (e) {
    console.error('加载任务详情失败', e)
  }
}

function openCheckpoint(cp, index) {
  currentCpIndex.value = index
  router.push(`/inspection/mobile/checkpoint/${cp.id}?taskId=${task.value.id}`)
}

function acceptTask() {
  task.value.taskStatus = 'accepted'
}
function startTask() {
  task.value.taskStatus = 'in_progress'
}
function submitTask() {
  task.value.taskStatus = 'submitted'
}

onMounted(loadDetail)
</script>

<style scoped>
.mobile-task-detail {
  display: flex;
  flex-direction: column;
  height: 100vh; height: 100dvh;
  background: #f5f5f5;
}
.m-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #0D9488, #0F766E);
  color: #fff;
  flex-shrink: 0;
}
.back-btn { cursor: pointer; display: flex; }
.m-title { flex: 1; font-size: 17px; font-weight: 600; }

.detail-scroll { flex: 1; overflow-y: auto; padding: 12px; }

.info-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.info-card h3 { margin: 0 0 4px; font-size: 16px; color: #1f2937; }
.task-code { font-size: 12px; color: #9ca3af; margin: 0 0 12px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-label { font-size: 11px; color: #9ca3af; }
.info-val { font-size: 14px; color: #374151; font-weight: 500; }
.info-val.overdue { color: #ef4444; }
.progress-wrap { display: flex; align-items: center; gap: 10px; }
.progress-bar { flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: #0D9488; border-radius: 4px; }
.progress-wrap span { font-size: 13px; color: #374151; font-weight: 600; }

.section-title { font-size: 14px; font-weight: 600; color: #374151; margin: 16px 0 8px; padding: 0 4px; }

.cp-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  cursor: pointer;
}
.cp-card.done { opacity: 0.7; }
.cp-card.current { border: 1.5px solid #0D9488; }
.cp-num {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
}
.cp-card.done .cp-num { background: #d1fae5; color: #10b981; }
.cp-info { flex: 1; }
.cp-name { display: block; font-size: 14px; color: #1f2937; font-weight: 500; }
.cp-type { font-size: 11px; color: #9ca3af; }

.action-bar {
  padding: 16px;
  display: flex;
  justify-content: center;
}
.action-btn { width: 100%; max-width: 320px; }
</style>

<style>
html.dark-mode .mobile-task-detail { background: #0F172A !important; }
html.dark-mode .info-card, html.dark-mode .cp-card { background: #1E293B !important; }
html.dark-mode .info-card h3, html.dark-mode .cp-name { color: #E2E8F0 !important; }
html.dark-mode .info-val { color: #CBD5E1 !important; }
html.dark-mode .section-title { color: #E2E8F0 !important; }
html.dark-mode .progress-bar { background: #334155 !important; }
html.dark-mode .cp-num { background: #334155 !important; }
html.dark-mode .progress-wrap span { color: #CBD5E1 !important; }
</style>
