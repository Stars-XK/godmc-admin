<template>
  <div class="config-form-container">
    <div class="form-header">
      <h3>GIS 地图配置</h3>
      <p>设置系统 WebGIS 模块使用的底图来源以及相关的地理坐标系转换规则。</p>
    </div>
    
    <el-form ref="formRef" :model="formData" label-position="top" class="premium-form" v-loading="loading">
      <el-row :gutter="24">
        <el-col :span="24">
          <el-form-item label="底图瓦片来源 (Map Source)">
            <el-radio-group v-model="formData['gis.map.source']" class="card-radio-group">
              <el-radio-button label="baidu">
                <div class="radio-content">
                  <el-icon><MapLocation /></el-icon>
                  <strong>百度地图</strong>
                </div>
              </el-radio-button>
              <el-radio-button label="amap">
                <div class="radio-content">
                  <el-icon><LocationInformation /></el-icon>
                  <strong>高德地图</strong>
                </div>
              </el-radio-button>
              <el-radio-button label="tianditu">
                <div class="radio-content">
                  <el-icon><Position /></el-icon>
                  <strong>天地图</strong>
                </div>
              </el-radio-button>
              <el-radio-button label="custom">
                <div class="radio-content">
                  <el-icon><Setting /></el-icon>
                  <strong>自定义服务</strong>
                </div>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        
        <el-col :span="24">
          <el-form-item label="默认坐标转换规则">
            <el-select v-model="formData['gis.coord.transform']" size="large" style="width: 100%">
              <el-option label="无转换 (直接使用原始坐标)" value="none" />
              <el-option label="WGS84 转换为 GCJ02 (火星坐标系)" value="WGS84_to_GCJ02" />
              <el-option label="BD09 (百度) 转换为 GCJ02" value="BD09_to_GCJ02" />
              <el-option label="自定义 Proj4 投影转换" value="custom_proj4" />
            </el-select>
            <div class="el-upload__tip">选择在将设备/管网坐标渲染至地图前，系统默认进行的坐标纠偏规则。</div>
          </el-form-item>
        </el-col>
        
        <el-col :span="24" v-if="formData['gis.coord.transform'] === 'custom_proj4'">
          <el-form-item label="自定义 Proj4 投影参数">
            <el-input 
              v-model="formData['gis.custom.proj4']" 
              type="textarea" 
              :rows="3" 
              placeholder="例如：+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=39500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs" 
              resize="none" 
            />
            <div class="el-upload__tip">请在此输入符合 Proj4 标准的投影参数字符串。</div>
          </el-form-item>
        </el-col>

      </el-row>
      
      <div class="form-actions">
        <el-button type="primary" size="large" @click="handleSave" :loading="saving" class="btn-primary">保存地图配置</el-button>
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
  'gis.map.source', 'gis.coord.transform', 'gis.custom.proj4'
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
    
    // 初始化默认值
    if (formData.value['gis.map.source'] === undefined) formData.value['gis.map.source'] = 'tianditu'
    if (formData.value['gis.coord.transform'] === undefined) formData.value['gis.coord.transform'] = 'none'
    if (formData.value['gis.custom.proj4'] === undefined) formData.value['gis.custom.proj4'] = '+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=39500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
    
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
      if (key === 'gis.map.source') name = 'GIS地图来源'
      if (key === 'gis.coord.transform') name = '默认坐标转换规则'
      if (key === 'gis.custom.proj4') name = '自定义Proj4投影参数'
      
      payload = { configName: name, configKey: key, configValue: formData.value[key], configType: 'Y', remark: 'GIS系统自动生成配置' }
      promises.push(addConfig(payload))
    }
  })
  
  Promise.all(promises).then(() => {
    proxy.$modal.msgSuccess('GIS地图配置保存成功')
    loadData() // 重新加载以获取新增后的 configId
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

.card-radio-group {
  display: flex;
  gap: 16px;
  width: 100%;
  flex-wrap: wrap;
  
  :deep(.el-radio-button) {
    flex: 1;
    min-width: 120px;
    
    .el-radio-button__inner {
      width: 100%;
      border-radius: 8px !important;
      border: 1px solid #d1d5db !important;
      padding: 16px;
      text-align: center;
      box-shadow: none !important;
      transition: all 0.2s;
      
      &:hover { border-color: #9ca3af !important; background-color: #f9fafb; color: #111827; }
    }
    
    &.is-active .el-radio-button__inner {
      background-color: #f0f9ff !important;
      border-color: #0284c7 !important;
      color: #0369a1;
      box-shadow: 0 0 0 1px #0284c7 !important;
    }
  }
}

.radio-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  .el-icon { font-size: 24px; color: #6b7280; transition: color 0.2s; }
  strong { font-size: 14px; }
}

:deep(.is-active) .radio-content .el-icon { color: #0369a1; }

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
