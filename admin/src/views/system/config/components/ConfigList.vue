<template>
  <div class="config-list-container">
    <div class="list-header">
      <div class="search-bar">
        <el-input v-model="searchQuery" placeholder="搜索参数名称或键名..." prefix-icon="Search" clearable @keyup.enter="handleQuery" @clear="handleQuery" class="search-input" />
        <button class="search-btn" @click="handleQuery">搜索</button>
      </div>
    </div>
    
    <div class="table-wrapper">
      <el-table v-loading="loading" :data="configList" class="premium-table" :row-style="{ height: '56px' }">
        <el-table-column label="参数名称" prop="configName" min-width="180" show-overflow-tooltip />
        <el-table-column label="参数键名" prop="configKey" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <code class="key-badge">{{ scope.row.configKey }}</code>
          </template>
        </el-table-column>
        <el-table-column label="参数键值" prop="configValue" min-width="150" show-overflow-tooltip />
        <el-table-column label="系统内置" prop="configType" width="100" align="center">
          <template #default="scope">
            <span class="type-badge" :class="scope.row.configType === 'Y' ? 'is-sys' : 'is-custom'">
              {{ scope.row.configType === 'Y' ? '是' : '否' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <button class="action-btn text-primary" @click="$emit('edit', scope.row)" v-hasPermi="['system:config:edit']" title="编辑">
                <el-icon><Edit /></el-icon>
              </button>
              <button class="action-btn text-danger" @click="$emit('delete', scope.row)" v-hasPermi="['system:config:remove']" v-if="scope.row.configType !== 'Y'" title="删除">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无参数数据" />
        </template>
      </el-table>
    </div>
    
    <div class="pagination-wrapper" v-if="total > 0">
      <pagination :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listConfig } from '@/api/system/config'

const emit = defineEmits(['edit', 'delete'])

const loading = ref(false)
const configList = ref([])
const total = ref(0)
const searchQuery = ref('')
const queryParams = ref({ pageNum: 1, pageSize: 20 })

function getList() {
  loading.value = true
  const params = {
    ...queryParams.value,
    configName: searchQuery.value || undefined,
    configKey: searchQuery.value || undefined
  }
  listConfig(params).then(res => {
    configList.value = res.rows || res.data.rows || res.data
    total.value = res.total || res.data.total || 0
    loading.value = false
  }).catch(() => { loading.value = false })
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

// Expose getList so parent can refresh it
defineExpose({ getList })

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.config-list-container {
  background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}
.list-header { margin-bottom: 20px; }
.search-bar {
  display: flex; gap: 12px;
  .search-input {
    width: 320px;
    :deep(.el-input__wrapper) {
      border-radius: 8px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #d1d5db inset !important;
      &.is-focus { box-shadow: 0 0 0 2px #111827 inset !important; }
    }
  }
  .search-btn {
    background-color: #ffffff; color: #111827; border: 1px solid #d1d5db; border-radius: 8px; padding: 0 20px; height: 32px;
    font-size: 14px; font-weight: 500; cursor: pointer;
    &:hover { background-color: #f9fafb; border-color: #9ca3af; }
  }
}
.table-wrapper {
  min-height: 600px; border-radius: 8px; border: 1px solid #f3f4f6; overflow: hidden;
}
.premium-table {
  :deep(.el-table__header th) { background-color: #f9fafb; color: #4b5563; font-weight: 600; font-size: 13px; }
}
.key-badge {
  background: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-size: 13px; color: #374151; font-family: monospace;
}
.type-badge {
  padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500;
  &.is-sys { background-color: #fee2e2; color: #b91c1c; }
  &.is-custom { background-color: #f3f4f6; color: #4b5563; }
}
.action-buttons {
  display: flex; justify-content: center; gap: 8px;
  .action-btn {
    background: transparent; border: none; cursor: pointer; padding: 6px; border-radius: 6px; display: flex;
    &:hover { background-color: #f3f4f6; }
    &.text-primary { color: #3b82f6; }
    &.text-danger { color: #ef4444; }
  }
}
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: flex-end; }
</style>
