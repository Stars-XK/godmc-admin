<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>数据库备份管理</span>
          <el-button type="primary" @click="handleCreate" :loading="creating" v-hasPermi="['system:backup:create']">
            <el-icon><Download /></el-icon> 立即备份
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="backupList" style="width: 100%">
        <el-table-column prop="filename" label="备份文件名" min-width="250" />
        <el-table-column prop="size" label="文件大小" width="150">
          <template #default="scope">
            {{ formatBytes(scope.row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="备份时间" width="200">
          <template #default="scope">
            {{ parseTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="warning" @click="handleRestore(scope.row)" v-hasPermi="['system:backup:restore']">
              <el-icon><RefreshLeft /></el-icon> 恢复
            </el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermi="['system:backup:remove']">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup name="Backup">
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

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
