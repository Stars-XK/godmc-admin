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
import { listConfig, updateConfig, addConfig } from '@/api/system/config'

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
    const list = res.rows || (res.data && res.data.rows) || (res.data && res.data.list) || (Array.isArray(res.data) ? res.data : [])
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
    let payload
    if (configListMap.value[key]) {
      payload = { ...configListMap.value[key], configValue: formData.value[key] }
      promises.push(updateConfig(payload))
    } else {
      let name = ''
      if (key === 'sys.storage.type') name = '存储策略'
      if (key === 'sys.storage.local.path') name = '本地存储路径'
      if (key === 'sys.storage.oss.endpoint') name = 'OSS Endpoint'
      if (key === 'sys.storage.oss.bucket') name = 'OSS Bucket'
      if (key === 'sys.storage.oss.accessKey') name = 'OSS AccessKey'
      if (key === 'sys.storage.oss.secretKey') name = 'OSS SecretKey'
      
      payload = { configName: name, configKey: key, configValue: formData.value[key], configType: 'Y', remark: '对象存储配置' }
      promises.push(addConfig(payload))
    }
  })
  
  Promise.all(promises).then(() => {
    proxy.$modal.msgSuccess('存储配置保存成功')
    loadData()
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
    &.is-focus, &:focus { box-shadow: 0 0 0 1px var(--el-color-primary) inset !important; }
  }
}
.custom-radio-group {
  :deep(.el-radio-button__inner) {
    border-radius: 8px !important; margin-right: 12px; border: 1px solid #d1d5db !important; box-shadow: none !important;
  }
  :deep(.el-radio-button.is-active .el-radio-button__inner) {
    background-color: var(--el-color-primary); border-color: var(--el-color-primary) !important; color: #ffffff;
  }
}
.form-actions {
  margin-top: 32px; padding-top: 24px; border-top: 1px solid #f3f4f6; display: flex; justify-content: flex-end;
}
.btn-primary {
  border-radius: 8px; font-weight: 500;
}
</style>
