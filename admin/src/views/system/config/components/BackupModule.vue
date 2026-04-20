<template>
  <div class="backup-module">
    <div class="module-header">
      <div class="header-info">
        <h3>数据库自动备份与恢复</h3>
        <p>查看与管理系统的物理备份文件，可执行手动备份与数据回滚。</p>
      </div>
      <button class="btn-primary" @click="handleCreate" :disabled="creating" v-hasPermi="['system:backup:create']">
        <el-icon class="mr-1" v-if="!creating"><Download /></el-icon>
        <el-icon class="mr-1 is-loading" v-else><Loading /></el-icon>
        {{ creating ? '备份中...' : '立即备份' }}
      </button>
    </div>

    <div class="table-container">
      <el-table v-loading="loading" :data="backupList" class="custom-table" :row-style="{ height: '60px' }">
        <el-table-column prop="filename" label="备份文件名" min-width="250">
          <template #default="scope">
            <div class="filename-cell">
              <el-icon><Document /></el-icon>
              <span>{{ scope.row.filename }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="文件大小" width="150">
          <template #default="scope">
            <span class="size-badge">{{ formatBytes(scope.row.size) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="备份时间" width="200">
          <template #default="scope">
            {{ parseTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="right">
          <template #default="scope">
            <div class="action-buttons">
              <button class="action-btn text-warning" @click="handleRestore(scope.row)" v-hasPermi="['system:backup:restore']" title="恢复">
                <el-icon><RefreshLeft /></el-icon>
              </button>
              <button class="action-btn text-danger" @click="handleDelete(scope.row)" v-hasPermi="['system:backup:remove']" title="删除">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无备份记录" />
        </template>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import { listBackups, createBackup, restoreBackup, delBackup } from '@/api/system/backup'

const { proxy } = getCurrentInstance()
const backupList = ref([])
const loading = ref(true)
const creating = ref(false)

function getList() {
  loading.value = true
  listBackups().then(res => {
    backupList.value = res.data
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

function handleCreate() {
  creating.value = true
  createBackup().then(() => {
    proxy.$modal.msgSuccess('备份成功')
    getList()
  }).finally(() => {
    creating.value = false
  })
}

function handleRestore(row) {
  proxy.$modal.confirm('确认要恢复到备份文件 "' + row.filename + '" 吗？此操作将覆盖当前数据库数据，且不可逆！').then(() => {
    return restoreBackup(row.filename)
  }).then(() => {
    proxy.$modal.msgSuccess('数据恢复成功')
  }).catch(() => {})
}

function handleDelete(row) {
  proxy.$modal.confirm('确认要删除备份文件 "' + row.filename + '" 吗？').then(() => {
    return delBackup(row.filename)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.backup-module {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f3f4f6;

  .header-info {
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 8px 0;
    }
    p {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }
  }
}

.btn-primary {
  background-color: #111827;
  color: #ffffff;
  border: 1px solid #111827;
  border-radius: 8px;
  padding: 0 20px;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  
  &:hover:not(:disabled) {
    background-color: #374151;
    border-color: #374151;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.table-container {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #f3f4f6;
  min-height: 600px;
  
  :deep(.el-table) {
    --el-table-border-color: #f3f4f6;
    --el-table-header-bg-color: #f9fafb;
    --el-table-header-text-color: #4b5563;
    
    th.el-table__cell {
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.05em;
    }
  }
}

.filename-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #111827;
  font-weight: 500;
  
  .el-icon {
    color: #9ca3af;
    font-size: 18px;
  }
}

.size-badge {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  color: #4b5563;
  font-family: 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', Consolas, monospace;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  
  .action-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    .el-icon {
      font-size: 16px;
    }
    
    &.text-warning {
      color: #d97706;
      &:hover {
        background-color: #fef3c7;
      }
    }
    
    &.text-danger {
      color: #dc2626;
      &:hover {
        background-color: #fee2e2;
      }
    }
  }
}
</style>
