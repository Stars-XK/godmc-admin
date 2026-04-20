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
