<template>
  <div class="app-container config-dashboard">
    <div class="config-header">
      <div class="header-info">
        <h2 class="page-title">系统参数配置</h2>
        <p class="page-desc">管理系统的全局运行参数、第三方服务密钥及核心功能开关。</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="handleRefreshCache">
          <el-icon class="mr-1"><Refresh /></el-icon>
          刷新系统缓存
        </button>
        <button class="btn-primary" @click="handleAdd" v-hasPermi="['system:config:add']">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增自定义参数
        </button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="custom-tabs" @tab-click="handleTabClick">
      <el-tab-pane name="system">
        <template #label>
          <div class="tab-label">
            <el-icon><Setting /></el-icon>
            <span>基础设置</span>
          </div>
        </template>
        
        <div class="tab-content-wrapper">
          <div class="search-bar">
            <el-input
              v-model="searchQuery"
              placeholder="搜索参数名称或键名..."
              prefix-icon="Search"
              clearable
              @keyup.enter="handleQuery"
              @clear="handleQuery"
              class="search-input"
            />
            <button class="search-btn" @click="handleQuery">搜索</button>
          </div>
          
          <div v-loading="loading" class="config-grid">
            <div v-if="filteredSystemConfigs.length === 0" class="empty-state">
              <el-empty description="暂无匹配的基础配置参数" />
            </div>
            
            <config-card 
              v-for="item in filteredSystemConfigs" 
              :key="item.configId" 
              :config="item"
              @edit="handleUpdate"
              @delete="handleDelete"
            />
          </div>
          
          <div class="pagination-wrapper" v-if="total > 0">
            <pagination
              :total="total"
              v-model:page="queryParams.pageNum"
              v-model:limit="queryParams.pageSize"
              @pagination="getList"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 扩展模块：邮件服务 (演示/预留) -->
      <el-tab-pane name="email">
        <template #label>
          <div class="tab-label">
            <el-icon><Message /></el-icon>
            <span>邮件服务 (SMTP)</span>
          </div>
        </template>
        <placeholder-module 
          icon="Message" 
          title="邮件推送服务配置" 
          description="集中管理系统的 SMTP 发信账号、服务器地址、端口及模板参数。" 
          buttonText="配置邮件服务" 
        />
      </el-tab-pane>

      <!-- 扩展模块：短信服务 (演示/预留) -->
      <el-tab-pane name="sms">
        <template #label>
          <div class="tab-label">
            <el-icon><ChatLineSquare /></el-icon>
            <span>短信服务 (SMS)</span>
          </div>
        </template>
        <placeholder-module 
          icon="ChatLineSquare" 
          title="短信网关配置" 
          description="接入阿里云、腾讯云等第三方短信提供商的 AccessKey 及签名信息。" 
          buttonText="配置短信网关" 
        />
      </el-tab-pane>

      <!-- 扩展模块：对象存储 (演示/预留) -->
      <el-tab-pane name="oss">
        <template #label>
          <div class="tab-label">
            <el-icon><Cloudy /></el-icon>
            <span>对象存储 (OSS)</span>
          </div>
        </template>
        <placeholder-module 
          icon="Cloudy" 
          title="云存储配置" 
          description="管理七牛云、又拍云、MinIO 等对象存储服务的 Bucket 与域名映射。" 
          buttonText="配置对象存储" 
        />
      </el-tab-pane>

      <!-- 扩展模块：数据库备份 -->
      <el-tab-pane name="backup">
        <template #label>
          <div class="tab-label">
            <el-icon><CopyDocument /></el-icon>
            <span>数据库备份 (DB)</span>
          </div>
        </template>
        <backup-module v-if="activeTab === 'backup'" />
      </el-tab-pane>
    </el-tabs>

    <!-- 添加或修改参数配置对话框 -->
    <config-dialog 
      v-model="open"
      :title="title"
      :form="form"
      :rules="rules"
      :sys_yes_no="sys_yes_no"
      @submit="submitForm"
    />
  </div>
</template>

<script setup name="Config">
import { ref, reactive, toRefs, computed, onMounted, getCurrentInstance } from 'vue'
import { listConfig, getConfig, delConfig, addConfig, updateConfig, refreshCache } from '@/api/system/config'
import ConfigCard from './components/ConfigCard.vue'
import PlaceholderModule from './components/PlaceholderModule.vue'
import ConfigDialog from './components/ConfigDialog.vue'
import BackupModule from './components/BackupModule.vue'

const { proxy } = getCurrentInstance()
const { sys_yes_no } = proxy.useDict('sys_yes_no')

const configList = ref([])
const filteredSystemConfigs = ref([])
const open = ref(false)
const loading = ref(true)
const total = ref(0)
const title = ref('')
const activeTab = ref('system')
const searchQuery = ref('')

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 20, // 改为20以更好地展示网格
    configName: undefined,
    configKey: undefined,
    configType: undefined
  },
  rules: {
    configName: [{ required: true, message: '参数名称不能为空', trigger: 'blur' }],
    configKey: [{ required: true, message: '参数键名不能为空', trigger: 'blur' }],
    configValue: [{ required: true, message: '参数键值不能为空', trigger: 'blur' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询参数列表 */
function getList() {
  loading.value = true
  listConfig(queryParams.value).then((response) => {
    configList.value = response.data.list
    filteredSystemConfigs.value = response.data.list
    total.value = response.data.total
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

/** 搜索/过滤本地数据 */
function handleQuery() {
  queryParams.value.pageNum = 1
  queryParams.value.configName = searchQuery.value ? searchQuery.value : undefined
  getList()
}

function handleTabClick(tab) {
  // 这里未来可以根据tab加载不同的配置API
  if (tab.paneName === 'system' && configList.value.length === 0) {
    getList()
  }
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 表单重置 */
function reset() {
  form.value = {
    configId: undefined,
    configName: undefined,
    configKey: undefined,
    configValue: undefined,
    configType: 'Y',
    remark: undefined
  }
  proxy.resetForm('configRef')
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = '添加全局参数'
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  getConfig(row.configId).then((response) => {
    form.value = response.data
    open.value = true
    title.value = '编辑全局参数'
  })
}

/** 提交按钮 */
function submitForm(submittedForm) {
  if (submittedForm.configId != undefined) {
    updateConfig(submittedForm).then(() => {
      proxy.$modal.msgSuccess('参数修改成功')
      open.value = false
      getList()
    })
  } else {
    addConfig(submittedForm).then(() => {
      proxy.$modal.msgSuccess('参数新增成功')
      open.value = false
      getList()
    })
  }
}

/** 删除按钮操作 */
function handleDelete(row) {
  proxy.$modal
    .confirm(`确认要删除配置项 "${row.configName}" 吗？`)
    .then(function () {
      return delConfig(row.configId)
    })
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
    })
    .catch(() => {})
}

/** 刷新缓存按钮操作 */
function handleRefreshCache() {
  refreshCache().then(() => {
    proxy.$modal.msgSuccess('系统配置缓存已成功刷新')
  })
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.app-container.config-dashboard {
  padding: 32px 40px !important;
  background-color: #fcfcfc !important;
  min-height: calc(100vh - 84px);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  
  .header-info {
    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 12px 0;
      letter-spacing: -0.02em;
    }
    .page-desc {
      color: #6b7280;
      font-size: 15px;
      margin: 0;
      line-height: 1.5;
      max-width: 600px;
    }
  }
}

.header-actions {
  display: flex;
  gap: 12px;

  .btn-primary {
    background-color: #111827;
    color: #ffffff;
    border: 1px solid #111827;
    border-radius: 8px;
    padding: 0 16px;
    height: 40px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    &:hover {
      background-color: #374151;
      border-color: #374151;
    }
  }

  .btn-secondary {
    background-color: #ffffff;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0 16px;
    height: 40px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    &:hover {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }
  }
}

/* Tabs Styling - Clean pill style */
:deep(.el-tabs__nav-wrap::after) {
  display: none;
}
:deep(.el-tabs__active-bar) {
  display: none;
}
:deep(.el-tabs__item) {
  padding: 0 20px !important;
  height: 40px;
  line-height: 40px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  border-radius: 9999px;
  transition: all 0.2s;
  margin-right: 8px;
  
  &:hover {
    color: #111827;
    background-color: #f3f4f6;
  }
  
  &.is-active {
    color: #111827;
    background-color: #e5e7eb;
  }
}
:deep(.el-tabs__header) {
  margin-bottom: 32px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  .el-icon {
    font-size: 16px;
  }
}

/* Search Bar */
.search-bar {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  .search-input {
    width: 380px;
    :deep(.el-input__wrapper) {
      border-radius: 8px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #d1d5db inset !important;
      padding: 8px 16px;
      background: #ffffff;
      transition: all 0.2s;
      
      &.is-focus {
        box-shadow: 0 0 0 2px #111827 inset !important;
      }
      
      .el-input__inner {
        font-size: 14px;
        color: #111827;
        &::placeholder {
          color: #9ca3af;
        }
      }
    }
  }
  
  .search-btn {
    background-color: #ffffff;
    color: #111827;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 0 20px;
    height: 40px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    cursor: pointer;
    &:hover {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }
  }
}

/* Grid Layout */
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

/* Removed Extracted Components CSS */

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  padding: 80px 0;
  display: flex;
  justify-content: center;
}

/* Pagination */
.pagination-wrapper {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  
  :deep(.el-pagination) {
    --el-pagination-button-bg-color: #ffffff;
    --el-pagination-hover-color: #111827;
    
    button {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #ffffff;
      &:hover {
        border-color: #d1d5db;
      }
    }
    
    .el-pager li {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #ffffff;
      margin: 0 4px;
      font-weight: 500;
      
      &:hover {
        border-color: #d1d5db;
        color: #111827;
      }
      
      &.is-active {
        background-color: #111827;
        border-color: #111827;
        color: #ffffff;
      }
    }
  }
}

/* Removed Placeholder CSS */

/* Removed Dialog CSS */
</style>
