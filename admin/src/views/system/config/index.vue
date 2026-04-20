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
            
            <div class="refined-card" v-for="item in filteredSystemConfigs" :key="item.configId">
              <div class="card-header">
                <div class="card-title-group">
                  <h3 class="card-title">{{ item.configName }}</h3>
                  <span class="card-badge" :class="item.configType === 'Y' ? 'badge-system' : 'badge-custom'">
                    {{ item.configType === 'Y' ? '系统内置' : '自定义' }}
                  </span>
                </div>
                <div class="card-actions">
                  <button class="action-btn" @click="handleUpdate(item)" v-hasPermi="['system:config:edit']" title="编辑">
                    <el-icon><Edit /></el-icon>
                  </button>
                  <button class="action-btn text-danger" @click="handleDelete(item)" v-hasPermi="['system:config:remove']" v-if="item.configType !== 'Y'" title="删除">
                    <el-icon><Delete /></el-icon>
                  </button>
                </div>
              </div>
              
              <div class="card-body">
                <div class="info-row">
                  <span class="info-label">键名</span>
                  <div class="info-value key-value" @click="copyText(item.configKey)">
                    <code>{{ item.configKey }}</code>
                    <el-icon class="copy-icon"><CopyDocument /></el-icon>
                  </div>
                </div>
                <div class="info-row">
                  <span class="info-label">键值</span>
                  <div class="info-value text-value" :title="item.configValue">
                    {{ item.configValue }}
                  </div>
                </div>
              </div>
              
              <div class="card-footer" v-if="item.remark">
                <p class="remark-text">{{ item.remark }}</p>
              </div>
            </div>
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
        <div class="placeholder-module">
          <div class="module-icon-bg">
            <el-icon><Message /></el-icon>
          </div>
          <h3>邮件推送服务配置</h3>
          <p>集中管理系统的 SMTP 发信账号、服务器地址、端口及模板参数。</p>
          <button class="btn-secondary" @click="mockFeature">配置邮件服务</button>
        </div>
      </el-tab-pane>

      <!-- 扩展模块：短信服务 (演示/预留) -->
      <el-tab-pane name="sms">
        <template #label>
          <div class="tab-label">
            <el-icon><ChatLineSquare /></el-icon>
            <span>短信服务 (SMS)</span>
          </div>
        </template>
        <div class="placeholder-module">
          <div class="module-icon-bg">
            <el-icon><ChatLineSquare /></el-icon>
          </div>
          <h3>短信网关配置</h3>
          <p>接入阿里云、腾讯云等第三方短信提供商的 AccessKey 及签名信息。</p>
          <button class="btn-secondary" @click="mockFeature">配置短信网关</button>
        </div>
      </el-tab-pane>

      <!-- 扩展模块：对象存储 (演示/预留) -->
      <el-tab-pane name="oss">
        <template #label>
          <div class="tab-label">
            <el-icon><Cloudy /></el-icon>
            <span>对象存储 (OSS)</span>
          </div>
        </template>
        <div class="placeholder-module">
          <div class="module-icon-bg">
            <el-icon><Cloudy /></el-icon>
          </div>
          <h3>云存储配置</h3>
          <p>管理七牛云、又拍云、MinIO 等对象存储服务的 Bucket 与域名映射。</p>
          <button class="btn-secondary" @click="mockFeature">配置对象存储</button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加或修改参数配置对话框 -->
    <el-dialog :title="title" v-model="open" width="550px" class="premium-dialog" append-to-body destroy-on-close>
      <el-form ref="configRef" :model="form" :rules="rules" label-width="90px" class="premium-form" label-position="top">
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="参数名称" prop="configName">
              <el-input v-model="form.configName" placeholder="例如：用户默认密码" size="large" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="参数键名" prop="configKey">
              <el-input v-model="form.configKey" placeholder="例如：sys.user.initPassword" size="large" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="参数键值" prop="configValue">
              <el-input v-model="form.configValue" placeholder="请输入实际的配置数值" size="large" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="configType">
              <template #label>
                <span class="label-with-tip">
                  系统内置属性
                  <el-tooltip effect="light" content="设置为'是'时，该配置项将被锁定，禁止被业务人员删除" placement="top">
                    <el-icon class="ml-1"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-radio-group v-model="form.configType" class="custom-radio-group">
                <el-radio-button v-for="dict in sys_yes_no" :key="dict.value" :label="dict.value">
                  {{ dict.label }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注说明" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="提供该参数的用途说明..." resize="none" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel" size="large">取 消</el-button>
          <button class="btn-primary" @click="submitForm">保存配置</button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Config">
import { ref, reactive, toRefs, computed, onMounted } from 'vue'
import { listConfig, getConfig, delConfig, addConfig, updateConfig, refreshCache } from '@/api/system/config'
import { ElMessage } from 'element-plus'
import { useClipboard } from '@vueuse/core'

const { proxy } = getCurrentInstance()
const { sys_yes_no } = proxy.useDict('sys_yes_no')
const { copy } = useClipboard()

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
function submitForm() {
  proxy.$refs['configRef'].validate((valid) => {
    if (valid) {
      if (form.value.configId != undefined) {
        updateConfig(form.value).then(() => {
          proxy.$modal.msgSuccess('参数修改成功')
          open.value = false
          getList()
        })
      } else {
        addConfig(form.value).then(() => {
          proxy.$modal.msgSuccess('参数新增成功')
          open.value = false
          getList()
        })
      }
    }
  })
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

async function copyText(text) {
  try {
    await copy(text)
    ElMessage.success('键名已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

function mockFeature() {
  ElMessage.info('该功能模块的UI已就绪，等待接入实际的API端点')
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

/* Refined Card */
.refined-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  
  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  
  .card-title-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .card-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      line-height: 1.4;
    }
    
    .card-badge {
      align-self: flex-start;
      font-size: 12px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 6px;
      letter-spacing: 0.02em;
      
      &.badge-system {
        background-color: #fee2e2;
        color: #b91c1c;
      }
      
      &.badge-custom {
        background-color: #f3f4f6;
        color: #4b5563;
      }
    }
  }
  
  .card-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    
    .action-btn {
      background: transparent;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      &:hover {
        background-color: #f3f4f6;
        color: #111827;
      }
      
      &.text-danger:hover {
        background-color: #fee2e2;
        color: #dc2626;
      }
    }
  }
}

.refined-card:hover .card-actions {
  opacity: 1;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-grow: 1;
  
  .info-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .info-label {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .info-value {
      font-size: 14px;
      color: #111827;
      line-height: 1.5;
    }
    
    .key-value {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      
      code {
        font-family: 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', Consolas, monospace;
        font-size: 13px;
        color: #374151;
      }
      
      .copy-icon {
        color: #9ca3af;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      &:hover {
        background-color: #f3f4f6;
        border-color: #d1d5db;
        
        .copy-icon {
          opacity: 1;
        }
      }
    }
    
    .text-value {
      background-color: #ffffff;
      border: 1px solid transparent;
      padding: 6px 0;
      word-break: break-all;
    }
  }
}

.card-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #e5e7eb;
  
  .remark-text {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

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

/* Placeholder Modules */
.placeholder-module {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  text-align: center;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  min-height: 400px;
  
  .module-icon-bg {
    width: 64px;
    height: 64px;
    background: #f3f4f6;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    
    .el-icon {
      font-size: 32px;
      color: #4b5563;
    }
  }
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 12px 0;
  }
  
  p {
    color: #6b7280;
    max-width: 400px;
    line-height: 1.6;
    margin: 0 0 32px 0;
  }
}

/* Dialog Forms */
.premium-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  :deep(.el-dialog__header) {
    padding: 24px 32px;
    border-bottom: 1px solid #e5e7eb;
    margin-right: 0;
    
    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }
  }
  
  :deep(.el-dialog__body) {
    padding: 32px;
  }
  
  :deep(.el-dialog__footer) {
    padding: 24px 32px;
    border-top: 1px solid #e5e7eb;
    background-color: #f9fafb;
  }
}

.premium-form {
  .el-form-item__label {
    font-weight: 500;
    color: #374151;
    padding-bottom: 8px;
    font-size: 14px;
  }
  
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 8px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #d1d5db inset !important;
    transition: all 0.2s;
    
    &:hover {
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #9ca3af inset !important;
    }
    
    &.is-focus, &:focus {
      box-shadow: 0 0 0 2px #111827 inset !important;
    }
  }
  
  .label-with-tip {
    display: flex;
    align-items: center;
  }
  
  .custom-radio-group {
    width: 100%;
    display: flex;
    gap: 12px;
    
    :deep(.el-radio-button) {
      flex: 1;
      .el-radio-button__inner {
        width: 100%;
        border-radius: 8px !important;
        border: 1px solid #d1d5db !important;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
        font-weight: 500;
        color: #374151;
        transition: all 0.2s;
      }
      
      &.is-active .el-radio-button__inner {
        background-color: #111827;
        border-color: #111827 !important;
        color: #ffffff;
      }
      
      &:not(.is-active):hover .el-radio-button__inner {
        background-color: #f9fafb;
      }
    }
  }
}
</style>
