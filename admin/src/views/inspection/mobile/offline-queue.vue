<template>
  <div class="mobile-offline-queue">
    <div class="m-header">
      <span class="back-btn" @click="$router.back()"><el-icon><ArrowLeft /></el-icon></span>
      <span class="m-title">离线同步</span>
      <el-tag :type="navigator.onLine ? 'success' : 'danger'" size="small">{{ navigator.onLine ? '在线' : '离线' }}</el-tag>
    </div>

    <div class="queue-content">
      <!-- 同步状态卡片 -->
      <div class="status-card">
        <div class="status-row">
          <div class="status-item">
            <span class="status-val">{{ queueStats.records }}</span>
            <span class="status-label">待同步记录</span>
          </div>
          <div class="status-item">
            <span class="status-val">{{ queueStats.locations }}</span>
            <span class="status-label">待同步GPS</span>
          </div>
          <div class="status-item">
            <span class="status-val">{{ queueStats.photos }}</span>
            <span class="status-label">待上传照片</span>
          </div>
        </div>
        <div class="sync-progress" v-if="syncing">
          <el-progress :percentage="syncPercent" :stroke-width="6" />
          <span class="sync-text">同步中...</span>
        </div>
      </div>

      <!-- 最近同步结果 -->
      <div class="result-card" v-if="lastSyncResult">
        <h4>最近同步</h4>
        <p class="result-time">{{ fmtTime(lastSyncResult.time) }}</p>
        <div v-for="(r, i) in lastSyncResult.results" :key="i" class="result-item">
          <el-icon color="#10B981"><CircleCheckFilled /></el-icon>
          {{ r }}
        </div>
      </div>

      <!-- 操作 -->
      <div class="queue-actions">
        <el-button
          type="primary"
          size="large"
          :loading="syncing"
          :disabled="queueStats.total === 0"
          class="sync-btn"
          @click="syncAll"
        >
          <el-icon><Upload /></el-icon> 立即同步 ({{ queueStats.total }})
        </el-button>
        <el-button
          size="large"
          :disabled="queueStats.total === 0"
          class="clear-btn"
          @click="clearAll"
        >
          清空队列
        </el-button>
      </div>

      <!-- 提示 -->
      <div class="tips-card">
        <el-icon><InfoFilled /></el-icon>
        <div>
          <p>离线数据暂存在浏览器中，网络恢复后自动同步。</p>
          <p>请勿清除浏览器数据，否则离线数据会丢失。</p>
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <div class="m-tabbar">
      <div class="tabbar-item" @click="$router.push('/inspection/mobile')">
        <el-icon :size="20"><List /></el-icon>
        <span>任务</span>
      </div>
      <div class="tabbar-item active">
        <el-icon :size="20"><Upload /></el-icon>
        <span>同步</span>
        <el-badge v-if="queueStats.total > 0" :value="queueStats.total" class="tabbar-badge" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ArrowLeft, Upload, List, InfoFilled, CircleCheckFilled } from '@element-plus/icons-vue'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { clearAllQueues } from '@/hooks/useOfflineSync'

const { syncing, queueStats, lastSyncResult, syncAll, refreshQueueStats, startAutoSync } = useOfflineSync()

const syncPercent = ref(0)

function fmtTime(d) {
  if (!d) return ''
  const t = new Date(d)
  return t.toLocaleString('zh-CN')
}

async function clearAll() {
  try {
    // ElMessageBox confirm
    await clearAllQueues()
    await refreshQueueStats()
  } catch (e) {
    // cancelled
  }
}

onMounted(() => {
  refreshQueueStats()
  startAutoSync(30000)
})
</script>

<style scoped>
.mobile-offline-queue {
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

.queue-content { flex: 1; overflow-y: auto; padding: 12px; }

.status-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}
.status-row { display: flex; text-align: center; }
.status-item { flex: 1; display: flex; flex-direction: column; }
.status-val { font-size: 28px; font-weight: 700; color: #0D9488; }
.status-label { font-size: 11px; color: #9ca3af; margin-top: 4px; }
.sync-progress { margin-top: 12px; }
.sync-text { font-size: 12px; color: #9ca3af; }

.result-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 12px;
}
.result-card h4 { margin: 0 0 4px; font-size: 14px; color: #374151; }
.result-time { font-size: 11px; color: #9ca3af; margin: 0 0 8px; }
.result-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  padding: 4px 0;
}

.queue-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.sync-btn, .clear-btn { width: 100%; }

.tips-card {
  display: flex;
  gap: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 14px;
  font-size: 12px;
  color: #3b82f6;
}
.tips-card p { margin: 0 0 4px; }

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
html.dark-mode .mobile-offline-queue { background: #0F172A !important; }
html.dark-mode .status-card, html.dark-mode .result-card { background: #1E293B !important; }
html.dark-mode .result-card h4 { color: #E2E8F0 !important; }
html.dark-mode .result-item, html.dark-mode p { color: #CBD5E1 !important; }
html.dark-mode .tips-card { background: rgba(59,130,246,.08) !important; border-color: rgba(59,130,246,.2) !important; }
html.dark-mode .m-tabbar { background: #1E293B !important; border-color: #334155 !important; }
</style>
