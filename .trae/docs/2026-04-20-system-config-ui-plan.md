# System Configuration UI Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the System Configuration page into a 5-tab interface with dedicated forms for common settings, and convert the raw parameter view to an `el-table`.

**Architecture:** Create new components (`SystemConfigForm.vue`, `MailSmsConfigForm.vue`, `StorageConfigForm.vue`, `ConfigList.vue`) and integrate them into `index.vue`. Add an SQL migration to inject missing `sys.web.*` and `sys.storage.*` keys.

**Tech Stack:** Vue 3, Element Plus, CSS/SCSS.

---

### Task 1: Create Database Migration for New Config Keys

**Files:**
- Create: `server/db/1.1.2-system-config-keys.sql`

- [ ] **Step 1: Write the SQL file to insert missing keys**

```sql
-- 1.1.2-system-config-keys.sql
-- System Web Config
INSERT IGNORE INTO sys_config (config_name, config_key, config_value, config_type, remark, create_time) VALUES
('网站Logo', 'sys.web.logo', 'https://example.com/logo.png', 'Y', '网站Logo URL地址', NOW()),
('网站名称', 'sys.web.siteName', 'Nest Admin', 'Y', '网站显示的全局名称', NOW()),
('网站标题', 'sys.web.title', 'Nest Admin 后台管理系统', 'Y', '浏览器标签页标题', NOW()),
('网站描述', 'sys.web.description', '一款基于 NestJS + Vue3 的后台管理系统', 'Y', '网站SEO描述信息', NOW()),
('系统主色调', 'sys.web.primaryColor', '#409eff', 'Y', '系统全局主色调', NOW());

-- Storage Config
INSERT IGNORE INTO sys_config (config_name, config_key, config_value, config_type, remark, create_time) VALUES
('存储方式', 'sys.storage.type', 'local', 'Y', '存储方式 (local/oss)', NOW()),
('本地存储路径', 'sys.storage.local.path', '/upload/files', 'Y', '本地存储目录', NOW()),
('OSS Endpoint', 'sys.storage.oss.endpoint', 'oss-cn-hangzhou.aliyuncs.com', 'Y', 'OSS Endpoint', NOW()),
('OSS AccessKey', 'sys.storage.oss.accessKey', '', 'Y', 'OSS AccessKey', NOW()),
('OSS SecretKey', 'sys.storage.oss.secretKey', '', 'Y', 'OSS SecretKey', NOW()),
('OSS Bucket', 'sys.storage.oss.bucket', 'my-bucket', 'Y', 'OSS Bucket名称', NOW());

-- Mail / SMS Placeholders
INSERT IGNORE INTO sys_config (config_name, config_key, config_value, config_type, remark, create_time) VALUES
('SMTP 服务器', 'sys.mail.smtp', 'smtp.example.com', 'Y', 'SMTP 发信服务器地址', NOW()),
('短信提供商', 'sys.sms.provider', 'aliyun', 'Y', '短信网关提供商', NOW());
```

- [ ] **Step 2: Commit**
```bash
git add server/db/1.1.2-system-config-keys.sql
git commit -m "feat(db): insert default keys for system configuration UI"
```

### Task 2: Build `SystemConfigForm.vue`

**Files:**
- Create: `admin/src/views/system/config/components/SystemConfigForm.vue`

- [ ] **Step 1: Write the System Config Form component**

```vue
<template>
  <div class="config-form-container">
    <div class="form-header">
      <h3>基础系统配置</h3>
      <p>设置网站的基础信息，如Logo、标题、描述和系统外观主题。</p>
    </div>
    
    <el-form ref="formRef" :model="formData" label-position="top" class="premium-form" v-loading="loading">
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="网站名称">
            <el-input v-model="formData['sys.web.siteName']" placeholder="例如：Nest Admin" size="large" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="网站标题">
            <el-input v-model="formData['sys.web.title']" placeholder="例如：Nest Admin 后台管理系统" size="large" />
          </el-form-item>
        </el-col>
        
        <el-col :span="24">
          <el-form-item label="网站描述">
            <el-input v-model="formData['sys.web.description']" type="textarea" :rows="3" placeholder="网站的SEO描述信息..." resize="none" />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="网站 Logo URL">
            <el-input v-model="formData['sys.web.logo']" placeholder="https://..." size="large">
              <template #prefix>
                <el-icon><Picture /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        
        <el-col :span="8">
          <el-form-item label="系统主色调">
            <el-color-picker v-model="formData['sys.web.primaryColor']" size="large" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="全局皮肤">
            <el-select v-model="formData['sys.index.skinName']" size="large" style="width: 100%">
              <el-option label="经典蓝 (skin-blue)" value="skin-blue" />
              <el-option label="清新绿 (skin-green)" value="skin-green" />
              <el-option label="优雅紫 (skin-purple)" value="skin-purple" />
              <el-option label="热情红 (skin-red)" value="skin-red" />
              <el-option label="明亮黄 (skin-yellow)" value="skin-yellow" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="侧边栏主题">
            <el-select v-model="formData['sys.index.sideTheme']" size="large" style="width: 100%">
              <el-option label="深色主题 (theme-dark)" value="theme-dark" />
              <el-option label="浅色主题 (theme-light)" value="theme-light" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <div class="form-actions">
        <el-button type="primary" size="large" @click="handleSave" :loading="saving" class="btn-primary">保存基础配置</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import { listConfig, updateConfig } from '@/api/system/config'

const { proxy } = getCurrentInstance()
const loading = ref(true)
const saving = ref(false)

const targetKeys = [
  'sys.web.siteName', 'sys.web.title', 'sys.web.description', 'sys.web.logo', 
  'sys.web.primaryColor', 'sys.index.skinName', 'sys.index.sideTheme'
]

const formData = ref({})
const configListMap = ref({}) // Store original config objects to retain IDs when updating

function loadData() {
  loading.value = true
  listConfig({ pageSize: 500 }).then(res => {
    const list = res.rows || res.data.rows || res.data
    list.forEach(item => {
      if (targetKeys.includes(item.configKey)) {
        formData.value[item.configKey] = item.configValue
        configListMap.value[item.configKey] = item
      }
    })
    // Initialize missing keys with empty strings just in case
    targetKeys.forEach(k => {
      if (formData.value[k] === undefined) formData.value[k] = ''
    })
    loading.value = false
  }).catch(() => { loading.value = false })
}

function handleSave() {
  saving.value = true
  const promises = []
  
  targetKeys.forEach(key => {
    if (configListMap.value[key]) {
      const payload = { ...configListMap.value[key], configValue: formData.value[key] }
      promises.push(updateConfig(payload))
    }
  })
  
  Promise.all(promises).then(() => {
    proxy.$modal.msgSuccess('基础系统配置保存成功')
  }).catch(() => {
    proxy.$modal.msgError('部分配置保存失败')
  }).finally(() => {
    saving.value = false
  })
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.config-form-container {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.form-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
  
  h3 { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px 0; }
  p { color: #6b7280; font-size: 14px; margin: 0; }
}

.premium-form {
  .el-form-item__label { font-weight: 500; color: #374151; padding-bottom: 8px; }
  :deep(.el-input__wrapper), :deep(.el-textarea__inner) {
    border-radius: 8px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #d1d5db inset !important;
    transition: all 0.2s;
    &:hover { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #9ca3af inset !important; }
    &.is-focus, &:focus { box-shadow: 0 0 0 2px #111827 inset !important; }
  }
}

.form-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background-color: #111827;
  border-color: #111827;
  color: #ffffff;
  border-radius: 8px;
  font-weight: 500;
  &:hover { background-color: #374151; border-color: #374151; }
}
</style>
```

- [ ] **Step 2: Commit**
```bash
git add admin/src/views/system/config/components/SystemConfigForm.vue
git commit -m "feat(admin): create system settings form component"
```

### Task 3: Build `StorageConfigForm.vue`

**Files:**
- Create: `admin/src/views/system/config/components/StorageConfigForm.vue`

- [ ] **Step 1: Write the Storage Config Form component**

```vue
<template>
  <div class="config-form-container">
    <div class="form-header">
      <h3>对象存储配置</h3>
      <p>管理系统文件的存储方式，支持本地存储与云端 OSS 存储。</p>
    </div>
    
    <el-form ref="formRef" :model="formData" label-position="top" class="premium-form" v-loading="loading">
      <el-row :gutter="24">
        <el-col :span="24">
          <el-form-item label="存储策略">
            <el-radio-group v-model="formData['sys.storage.type']" size="large" class="custom-radio-group">
              <el-radio-button label="local">本地存储</el-radio-button>
              <el-radio-button label="oss">云端 OSS (阿里云等)</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        
        <!-- 本地存储配置 -->
        <template v-if="formData['sys.storage.type'] === 'local'">
          <el-col :span="24">
            <el-form-item label="本地存储路径">
              <el-input v-model="formData['sys.storage.local.path']" placeholder="/upload/files" size="large" />
            </el-form-item>
          </el-col>
        </template>
        
        <!-- OSS 存储配置 -->
        <template v-if="formData['sys.storage.type'] === 'oss'">
          <el-col :span="12">
            <el-form-item label="Endpoint (地域节点)">
              <el-input v-model="formData['sys.storage.oss.endpoint']" placeholder="oss-cn-hangzhou.aliyuncs.com" size="large" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Bucket (存储空间名称)">
              <el-input v-model="formData['sys.storage.oss.bucket']" placeholder="my-bucket" size="large" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="AccessKey ID">
              <el-input v-model="formData['sys.storage.oss.accessKey']" placeholder="请输入 AccessKey ID" size="large" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="AccessKey Secret">
              <el-input v-model="formData['sys.storage.oss.secretKey']" type="password" show-password placeholder="请输入 AccessKey Secret" size="large" />
            </el-form-item>
          </el-col>
        </template>
      </el-row>
      
      <div class="form-actions">
        <el-button type="primary" size="large" @click="handleSave" :loading="saving" class="btn-primary">保存存储配置</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import { listConfig, updateConfig } from '@/api/system/config'

const { proxy } = getCurrentInstance()
const loading = ref(true)
const saving = ref(false)

const targetKeys = [
  'sys.storage.type', 'sys.storage.local.path', 'sys.storage.oss.endpoint', 
  'sys.storage.oss.bucket', 'sys.storage.oss.accessKey', 'sys.storage.oss.secretKey'
]

const formData = ref({})
const configListMap = ref({})

function loadData() {
  loading.value = true
  listConfig({ pageSize: 500 }).then(res => {
    const list = res.rows || res.data.rows || res.data
    list.forEach(item => {
      if (targetKeys.includes(item.configKey)) {
        formData.value[item.configKey] = item.configValue
        configListMap.value[item.configKey] = item
      }
    })
    targetKeys.forEach(k => {
      if (formData.value[k] === undefined) formData.value[k] = ''
    })
    if (!formData.value['sys.storage.type']) formData.value['sys.storage.type'] = 'local'
    loading.value = false
  }).catch(() => { loading.value = false })
}

function handleSave() {
  saving.value = true
  const promises = []
  
  targetKeys.forEach(key => {
    if (configListMap.value[key]) {
      const payload = { ...configListMap.value[key], configValue: formData.value[key] }
      promises.push(updateConfig(payload))
    }
  })
  
  Promise.all(promises).then(() => {
    proxy.$modal.msgSuccess('存储配置保存成功')
  }).catch(() => {
    proxy.$modal.msgError('部分配置保存失败')
  }).finally(() => {
    saving.value = false
  })
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.config-form-container {
  background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}
.form-header {
  margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;
  h3 { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px 0; }
  p { color: #6b7280; font-size: 14px; margin: 0; }
}
.premium-form {
  .el-form-item__label { font-weight: 500; color: #374151; padding-bottom: 8px; }
  :deep(.el-input__wrapper) {
    border-radius: 8px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #d1d5db inset !important; transition: all 0.2s;
    &:hover { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #9ca3af inset !important; }
    &.is-focus, &:focus { box-shadow: 0 0 0 2px #111827 inset !important; }
  }
}
.custom-radio-group {
  :deep(.el-radio-button__inner) {
    border-radius: 8px !important; margin-right: 12px; border: 1px solid #d1d5db !important; box-shadow: none !important;
  }
  :deep(.el-radio-button.is-active .el-radio-button__inner) {
    background-color: #111827; border-color: #111827 !important; color: #ffffff;
  }
}
.form-actions {
  margin-top: 32px; padding-top: 24px; border-top: 1px solid #f3f4f6; display: flex; justify-content: flex-end;
}
.btn-primary {
  background-color: #111827; border-color: #111827; color: #ffffff; border-radius: 8px; font-weight: 500;
  &:hover { background-color: #374151; border-color: #374151; }
}
</style>
```

- [ ] **Step 2: Commit**
```bash
git add admin/src/views/system/config/components/StorageConfigForm.vue
git commit -m "feat(admin): create storage config form component"
```

### Task 4: Build `ConfigList.vue`

**Files:**
- Create: `admin/src/views/system/config/components/ConfigList.vue`

- [ ] **Step 1: Write the ConfigList component**

```vue
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
```

- [ ] **Step 2: Commit**
```bash
git add admin/src/views/system/config/components/ConfigList.vue
git commit -m "feat(admin): create generic config list table component"
```

### Task 5: Refactor `index.vue` to use 5 Tabs

**Files:**
- Modify: `admin/src/views/system/config/index.vue`

- [ ] **Step 1: Replace content in `index.vue`**

```vue
<template>
  <div class="app-container config-dashboard">
    <div class="config-header">
      <div class="header-info">
        <h2 class="page-title">系统参数配置</h2>
        <p class="page-desc">管理系统的全局运行参数、基础外观设置及第三方服务配置。</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="handleRefreshCache">
          <el-icon class="mr-1"><Refresh /></el-icon>
          刷新系统缓存
        </button>
        <button class="btn-primary" @click="handleAdd" v-hasPermi="['system:config:add']" v-if="activeTab === 'list'">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增自定义参数
        </button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="custom-tabs">
      <el-tab-pane name="system">
        <template #label><div class="tab-label"><el-icon><Setting /></el-icon><span>系统配置</span></div></template>
        <system-config-form v-if="activeTab === 'system'" />
      </el-tab-pane>

      <el-tab-pane name="mail_sms">
        <template #label><div class="tab-label"><el-icon><Message /></el-icon><span>邮件/短信</span></div></template>
        <placeholder-module icon="Message" title="邮件与短信配置" description="集成 SMTP 发信账号与第三方短信网关服务。" buttonText="保存配置" />
      </el-tab-pane>

      <el-tab-pane name="storage">
        <template #label><div class="tab-label"><el-icon><Cloudy /></el-icon><span>对象存储</span></div></template>
        <storage-config-form v-if="activeTab === 'storage'" />
      </el-tab-pane>

      <el-tab-pane name="backup">
        <template #label><div class="tab-label"><el-icon><CopyDocument /></el-icon><span>数据库备份</span></div></template>
        <backup-module v-if="activeTab === 'backup'" />
      </el-tab-pane>

      <el-tab-pane name="list">
        <template #label><div class="tab-label"><el-icon><Operation /></el-icon><span>参数列表</span></div></template>
        <config-list ref="configListRef" v-if="activeTab === 'list'" @edit="handleUpdate" @delete="handleDelete" />
      </el-tab-pane>
    </el-tabs>

    <config-dialog v-model="open" :title="title" :form="form" :rules="rules" :sys_yes_no="sys_yes_no" @submit="submitForm" />
  </div>
</template>

<script setup name="Config">
import { ref, reactive, toRefs, getCurrentInstance } from 'vue'
import { delConfig, addConfig, updateConfig, refreshCache } from '@/api/system/config'
import SystemConfigForm from './components/SystemConfigForm.vue'
import StorageConfigForm from './components/StorageConfigForm.vue'
import BackupModule from './components/BackupModule.vue'
import ConfigList from './components/ConfigList.vue'
import PlaceholderModule from './components/PlaceholderModule.vue'
import ConfigDialog from './components/ConfigDialog.vue'

const { proxy } = getCurrentInstance()
const { sys_yes_no } = proxy.useDict('sys_yes_no')

const activeTab = ref('system')
const configListRef = ref(null)
const open = ref(false)
const title = ref('')

const data = reactive({
  form: {},
  rules: {
    configName: [{ required: true, message: '参数名称不能为空', trigger: 'blur' }],
    configKey: [{ required: true, message: '参数键名不能为空', trigger: 'blur' }],
    configValue: [{ required: true, message: '参数键值不能为空', trigger: 'blur' }]
  }
})
const { form, rules } = toRefs(data)

function handleRefreshCache() {
  refreshCache().then(() => { proxy.$modal.msgSuccess('系统配置缓存已成功刷新') })
}

function reset() {
  form.value = { configId: undefined, configName: undefined, configKey: undefined, configValue: undefined, configType: 'Y', remark: undefined }
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '添加参数'
}

function handleUpdate(row) {
  reset()
  form.value = { ...row }
  open.value = true
  title.value = '修改参数'
}

function submitForm(submittedForm) {
  if (submittedForm.configId != undefined) {
    updateConfig(submittedForm).then(() => {
      proxy.$modal.msgSuccess('参数修改成功')
      open.value = false
      if (configListRef.value) configListRef.value.getList()
    })
  } else {
    addConfig(submittedForm).then(() => {
      proxy.$modal.msgSuccess('参数新增成功')
      open.value = false
      if (configListRef.value) configListRef.value.getList()
    })
  }
}

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除名称为"' + row.configName + '"的数据项？').then(() => {
    return delConfig(row.configId)
  }).then(() => {
    if (configListRef.value) configListRef.value.getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.app-container.config-dashboard {
  padding: 32px 40px !important; background-color: #fcfcfc !important; min-height: calc(100vh - 84px);
  font-family: 'Inter', sans-serif;
}
.config-header {
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;
  .header-info {
    .page-title { font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 12px 0; }
    .page-desc { color: #6b7280; font-size: 15px; margin: 0; }
  }
}
.header-actions { display: flex; gap: 12px; }
.btn-primary {
  background-color: #111827; color: #ffffff; border: 1px solid #111827; border-radius: 8px; padding: 0 16px; height: 40px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center;
  &:hover { background-color: #374151; border-color: #374151; }
}
.btn-secondary {
  background-color: #ffffff; color: #374151; border: 1px solid #d1d5db; border-radius: 8px; padding: 0 16px; height: 40px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center;
  &:hover { background-color: #f9fafb; border-color: #9ca3af; }
}
:deep(.el-tabs__nav-wrap::after), :deep(.el-tabs__active-bar) { display: none; }
:deep(.el-tabs__item) {
  padding: 0 20px !important; height: 40px; line-height: 40px; font-size: 14px; font-weight: 500; color: #6b7280; border-radius: 9999px; transition: all 0.2s; margin-right: 8px;
  &:hover { color: #111827; background-color: #f3f4f6; }
  &.is-active { color: #111827; background-color: #e5e7eb; }
}
:deep(.el-tabs__header) { margin-bottom: 32px; }
.tab-label { display: flex; align-items: center; gap: 8px; .el-icon { font-size: 16px; } }
</style>
```

- [ ] **Step 2: Commit**
```bash
git add admin/src/views/system/config/index.vue
git commit -m "refactor(admin): reorganize config page into 5 tabs with forms and table"
```

### Task 6: Apply Pagination Rule to Backup Module

**Files:**
- Modify: `admin/src/views/system/config/components/BackupModule.vue`

- [ ] **Step 1: Ensure pagination exists or set `max-height` / `min-height` appropriately to enforce the height rule.**
(Since Backup List might just be all local files without backend pagination, we add `min-height: 600px` to `.table-container` in BackupModule.vue so it matches the aesthetic rule requested).

Modify `<style>` in `admin/src/views/system/config/components/BackupModule.vue`:
```css
.table-container {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #f3f4f6;
  min-height: 600px;
}
```

- [ ] **Step 2: Commit**
```bash
git add admin/src/views/system/config/components/BackupModule.vue
git commit -m "style(admin): enforce min-height on backup list table"
```
---
