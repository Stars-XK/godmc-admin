<template>
  <div class="mobile-app">
    <!-- 顶部状态栏 -->
    <div class="m-header">
      <span class="m-title">智慧水务巡检</span>
      <div class="m-status">
        <span class="status-dot" :class="online ? 'online' : 'offline'"></span>
        <span class="status-text">{{ online ? '在线' : '离线' }}</span>
        <el-badge v-if="queueStats.total > 0" :value="queueStats.total" class="sync-badge" />
      </div>
    </div>

    <!-- 任务类型切换 -->
    <div class="m-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="m-tab"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
        <span v-if="tab.key === 'pending' && pendingCount" class="tab-count">{{ pendingCount }}</span>
      </div>
    </div>

    <!-- 任务卡片列表 -->
    <div class="m-task-list" v-loading="loading">
      <div
        v-for="task in taskList"
        :key="task.id"
        class="task-card"
        :class="cardStatusClass(task.taskStatus)"
        @click="openTask(task)"
      >
        <div class="card-top">
          <span class="card-code">{{ task.taskCode }}</span>
          <el-tag :type="statusTagType(task.taskStatus)" size="small">
            {{ statusMap[task.taskStatus] || task.taskStatus }}
          </el-tag>
        </div>
        <div class="card-body">
          <span class="card-name">{{ task.taskName }}</span>
          <span class="card-route" v-if="task.routeName">
            <el-icon><Location /></el-icon> {{ task.routeName }}
          </span>
        </div>
        <div class="card-foot">
          <div class="progress-wrap">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (task.completionRatio || 0) + '%' }"></div>
            </div>
            <span class="progress-text">{{ task.completionRatio || 0 }}%</span>
          </div>
          <span class="card-deadline" v-if="task.deadline">
            <el-icon><Clock /></el-icon> {{ fmtDate(task.deadline) }}
          </span>
        </div>
      </div>

      <el-empty v-if="!loading && !taskList.length" description="暂无任务">
        <el-button type="primary" size="small" @click="loadTasks">刷新</el-button>
      </el-empty>
    </div>

    <!-- 底部导航栏 -->
    <div class="m-tabbar">
      <div class="tabbar-item active">
        <el-icon :size="20"><List /></el-icon>
        <span>任务</span>
      </div>
      <div class="tabbar-item" @click="$router.push('/inspection/mobile/queue')">
        <el-icon :size="20"><Upload /></el-icon>
        <span>同步</span>
        <el-badge v-if="queueStats.total > 0" :value="queueStats.total" class="tabbar-badge" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Location, Clock, List, Upload } from '@element-plus/icons-vue'
import { listTask } from '@/api/inspection/task'
import { getQueueStats } from '@/hooks/useOfflineSync'

const router = useRouter()
const loading = ref(true)
const online = ref(navigator.onLine)
const activeTab = ref('today')
const taskList = ref([])
const pendingCount = ref(0)
const queueStats = reactive({ total: 0 })

const tabs = [
  { key: 'today', label: '今日任务' },
  { key: 'pending', label: '待处理' },
  { key: 'all', label: '全部' },
]

const statusMap = {
  pending: '待接收', accepted: '已接收', in_progress: '进行中',
  submitted: '已提交', reviewed: '已审核', closed: '已完成', overdue: '已超时',
}

function statusTagType(s) {
  return { pending: 'info', accepted: '', in_progress: 'warning', submitted: '', reviewed: '', closed: 'success', overdue: 'danger' }[s] || 'info'
}

function cardStatusClass(s) {
  return { overdue: 'card-overdue', in_progress: 'card-active', closed: 'card-done' }[s] || ''
}

function fmtDate(d) {
  if (!d) return ''
  const t = new Date(d)
  const m = t.getMonth() + 1
  const day = t.getDate()
  const h = String(t.getHours()).padStart(2, '0')
  const min = String(t.getMinutes()).padStart(2, '0')
  return `${m}/${day} ${h}:${min}`
}

async function loadTasks() {
  loading.value = true
  try {
    const params = { pageNum: 1, pageSize: 50 }
    if (activeTab.value === 'today') {
      params.taskStatus = undefined // all today
    } else if (activeTab.value === 'pending') {
      params.taskStatus = 'pending'
    }
    const res = await listTask(params)
    taskList.value = res.data?.list || res.data || []
    pendingCount.value = taskList.value.filter(t => t.taskStatus === 'pending').length
  } catch (e) {
    console.error('加载任务失败', e)
  } finally {
    loading.value = false
  }
}

async function refreshQueue() {
  const stats = await getQueueStats()
  Object.assign(queueStats, stats)
}

function switchTab(key) {
  activeTab.value = key
  loadTasks()
}

function openTask(task) {
  router.push(`/inspection-mobile/task/${task.id}`)
}

onMounted(() => {
  loadTasks()
  refreshQueue()
  window.addEventListener('online', () => { online.value = true; loadTasks() })
  window.addEventListener('offline', () => { online.value = false })
  const timer = setInterval(refreshQueue, 10000)
  // cleanup in real component lifecycle
})
</script>

<style scoped>
.mobile-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: #f5f5f5;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

/* 顶部 */
.m-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #0D9488, #0F766E);
  color: #fff;
  flex-shrink: 0;
}
.m-title { font-size: 18px; font-weight: 700; }
.m-status { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-dot.online { background: #4ade80; }
.status-dot.offline { background: #f87171; }
.sync-badge { margin-left: 4px; }

/* tabs */
.m-tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.m-tab {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  color: #6b7280;
  position: relative;
  cursor: pointer;
}
.m-tab.active { color: #0D9488; font-weight: 600; }
.m-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 30%;
  right: 30%;
  height: 2px;
  background: #0D9488;
  border-radius: 1px;
}
.tab-count {
  background: #ef4444;
  color: #fff;
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 10px;
  margin-left: 4px;
}

/* 任务列表 */
.m-task-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.task-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  cursor: pointer;
}
.task-card.card-overdue { border-left: 4px solid #ef4444; }
.task-card.card-active { border-left: 4px solid #f59e0b; }
.task-card.card-done { opacity: 0.7; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.card-code { font-size: 12px; color: #9ca3af; }
.card-body { margin-bottom: 10px; }
.card-name { display: block; font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 4px; }
.card-route { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 4px; }
.card-foot { display: flex; align-items: center; gap: 12px; }
.progress-wrap { flex: 1; display: flex; align-items: center; gap: 8px; }
.progress-bar { flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: #0D9488; border-radius: 3px; transition: width 0.3s; }
.progress-text { font-size: 11px; color: #6b7280; min-width: 32px; }
.card-deadline { font-size: 11px; color: #9ca3af; display: flex; align-items: center; gap: 3px; }

/* 底部导航栏 */
.m-tabbar {
  display: flex;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom);
}
.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 0;
  font-size: 10px;
  color: #9ca3af;
  cursor: pointer;
  position: relative;
}
.tabbar-item.active { color: #0D9488; }
.tabbar-badge { position: absolute; top: 4px; left: 55%; }
</style>

<style>
html.dark-mode .mobile-app { background: #0F172A !important; }
html.dark-mode .m-tabs { background: #1E293B !important; border-color: #334155 !important; }
html.dark-mode .task-card { background: #1E293B !important; }
html.dark-mode .card-name { color: #E2E8F0 !important; }
html.dark-mode .card-route, html.dark-mode .card-code, html.dark-mode .card-deadline, html.dark-mode .progress-text { color: #94A3B8 !important; }
html.dark-mode .progress-bar { background: #334155 !important; }
html.dark-mode .m-tabbar { background: #1E293B !important; border-color: #334155 !important; }
html.dark-mode .m-tab { color: #94A3B8 !important; }
html.dark-mode .m-tab.active { color: #5EEAD4 !important; }
</style>
