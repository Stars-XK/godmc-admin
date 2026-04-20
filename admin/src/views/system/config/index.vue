<template>
  <div class="app-container config-dashboard">
    <div class="config-header">
      <div class="header-info">
        <h2 class="page-title">系统参数配置</h2>
        <p class="page-desc">管理系统的全局运行参数、第三方服务密钥及核心功能开关。</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="Refresh" @click="handleRefreshCache" class="glow-btn">
          刷新系统缓存
        </el-button>
        <el-button plain icon="Plus" @click="handleAdd" v-hasPermi="['system:config:add']">
          新增自定义参数
        </el-button>
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
            <el-button type="primary" class="ml-4" @click="handleQuery">搜索</el-button>
          </div>
          
          <div v-loading="loading" class="config-grid">
            <div v-if="filteredSystemConfigs.length === 0" class="empty-state">
              <el-empty description="暂无匹配的基础配置参数" />
            </div>
            
            <el-card v-for="item in filteredSystemConfigs" :key="item.configId" class="config-item-card" shadow="hover">
              <div class="card-top">
                <div class="config-title-wrap">
                  <h3 class="config-name">{{ item.configName }}</h3>
                  <el-tag :type="item.configType === 'Y' ? 'danger' : 'info'" size="small" class="type-tag" effect="light">
                    {{ item.configType === 'Y' ? '系统内置' : '自定义' }}
                  </el-tag>
                </div>
                <div class="config-actions">
                  <el-tooltip content="编辑" placement="top">
                    <el-button type="primary" link icon="Edit" @click="handleUpdate(item)" v-hasPermi="['system:config:edit']" />
                  </el-tooltip>
                  <el-tooltip content="删除" placement="top" v-if="item.configType !== 'Y'">
                    <el-button type="danger" link icon="Delete" @click="handleDelete(item)" v-hasPermi="['system:config:remove']" />
                  </el-tooltip>
                </div>
              </div>
              
              <div class="config-key-box">
                <code>{{ item.configKey }}</code>
                <el-icon class="copy-icon" @click="copyText(item.configKey)"><CopyDocument /></el-icon>
              </div>
              
              <div class="config-value-box">
                <span class="value-label">当前值：</span>
                <span class="value-text" :title="item.configValue">{{ item.configValue }}</span>
              </div>
              
              <div class="config-remark" v-if="item.remark">
                <el-icon><InfoFilled /></el-icon>
                <span>{{ item.remark }}</span>
              </div>
            </el-card>
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
          <el-button type="primary" plain class="mt-4" @click="mockFeature">配置邮件服务</el-button>
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
          <el-button type="primary" plain class="mt-4" @click="mockFeature">配置短信网关</el-button>
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
          <el-button type="primary" plain class="mt-4" @click="mockFeature">配置对象存储</el-button>
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
          <el-button type="primary" @click="submitForm" size="large" class="glow-btn">保存配置</el-button>
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
.config-dashboard {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  
  .header-info {
    .page-title {
      font-size: 24px;
      font-weight: 700;
      color: #0F172A;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .page-desc {
      color: #64748B;
      font-size: 14px;
      margin: 0;
    }
  }
}

.glow-btn {
  box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.39) !important;
  &:hover {
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.23) !important;
  }
}

.custom-tabs {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #F1F5F9;
  overflow: hidden;
  
  :deep(.el-tabs__nav-wrap) {
    padding: 0 24px;
    margin-bottom: 0;
    &::after {
      height: 1px;
      background-color: #F1F5F9;
    }
  }
  
  :deep(.el-tabs__active-bar) {
    height: 3px;
    border-radius: 3px 3px 0 0;
  }
  
  :deep(.el-tabs__item) {
    height: 60px;
    font-size: 15px;
    color: #64748B;
    &.is-active {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  .el-icon {
    font-size: 18px;
  }
}

.tab-content-wrapper {
  padding: 24px;
  background-color: #F8FAFC;
  min-height: 400px;
}

.search-bar {
  margin-bottom: 24px;
  display: flex;
  
  .search-input {
    width: 320px;
    :deep(.el-input__wrapper) {
      border-radius: 100px;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #E2E8F0 inset !important;
      padding: 4px 16px;
      background: #FFFFFF;
      
      &.is-focus {
        box-shadow: 0 0 0 2px var(--el-color-primary) inset !important;
      }
    }
  }
}

/* Grid Layout for Config Cards */
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.config-item-card {
  border: 1px solid #E2E8F0 !important;
  border-radius: 12px !important;
  background: #FFFFFF;
  transition: all 0.3s ease;
  
  :deep(.el-card__body) {
    padding: 20px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05) !important;
    border-color: var(--el-color-primary-light-7) !important;
  }
  
  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    
    .config-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      .config-name {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #0F172A;
        line-height: 1.3;
      }
      
      .type-tag {
        align-self: flex-start;
        border: none !important;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
    }
    
    .config-actions {
      display: flex;
      gap: 4px;
      .el-button {
        padding: 4px;
        height: auto;
        font-size: 16px;
        color: #94A3B8;
        &:hover {
          color: var(--el-color-primary);
        }
        &.el-button--danger:hover {
          color: var(--el-color-danger);
        }
      }
    }
  }
  
  .config-key-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #F1F5F9;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    
    code {
      font-family: 'Fira Code', monospace;
      font-size: 13px;
      color: #334155;
      word-break: break-all;
    }
    
    .copy-icon {
      color: #94A3B8;
      cursor: pointer;
      font-size: 16px;
      transition: color 0.2s;
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
  
  .config-value-box {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16px;
    font-size: 14px;
    
    .value-label {
      color: #64748B;
      white-space: nowrap;
      margin-right: 8px;
    }
    
    .value-text {
      color: #0F172A;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
  
  .config-remark {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 13px;
    color: #94A3B8;
    background: #F8FAFC;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px dashed #E2E8F0;
    
    .el-icon {
      margin-top: 2px;
      color: var(--el-color-info);
    }
    
    span {
      line-height: 1.5;
    }
  }
}

.empty-state {
  grid-column: 1 / -1;
  padding: 40px 0;
}

.pagination-wrapper {
  padding-top: 20px;
  border-top: 1px solid #E2E8F0;
  margin-top: 20px;
  
  :deep(.pagination-container) {
    margin: 0 !important;
    padding: 0 !important;
  }
}

/* Placeholder Modules */
.placeholder-module {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  background-color: #F8FAFC;
  min-height: 400px;
  
  .module-icon-bg {
    width: 80px;
    height: 80px;
    background: #FFFFFF;
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    margin-bottom: 24px;
    
    .el-icon {
      font-size: 36px;
      color: var(--el-color-primary);
    }
  }
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #0F172A;
    margin: 0 0 12px 0;
  }
  
  p {
    color: #64748B;
    max-width: 400px;
    line-height: 1.6;
    margin: 0 0 24px 0;
  }
}

/* Form Overrides */
.premium-form {
  .el-form-item__label {
    font-weight: 500;
    color: #334155;
    padding-bottom: 8px;
  }
  
  .label-with-tip {
    display: flex;
    align-items: center;
  }
  
  .custom-radio-group {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    :deep(.el-radio-button) {
      flex: 1 1 calc(50% - 12px);
      min-width: 120px;
      .el-radio-button__inner {
        width: 100%;
        border-radius: 6px !important;
        border-left: 1px solid var(--el-border-color) !important;
        box-shadow: none !important;
      }
      &.is-active .el-radio-button__inner {
        background-color: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary) !important;
        color: var(--el-color-primary);
      }
    }
  }
}

.dialog-footer {
  padding-top: 10px;
  .el-button {
    border-radius: 8px;
    padding: 12px 24px;
    font-weight: 500;
  }
}
</style>
