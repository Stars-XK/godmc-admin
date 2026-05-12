<template>
  <div class="config-form-container">
    <div class="form-header">
      <div class="header-left">
        <h3>GIS 地图配置</h3>
        <p>设置系统 WebGIS 模块使用的底图来源以及相关的地理坐标系转换规则。</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleSave" :loading="saving" class="btn-primary">保存地图配置</el-button>
      </div>
    </div>

    <el-form ref="formRef" :model="formData" label-position="top" class="premium-form" v-loading="loading">
      <el-row :gutter="24">
        <el-col :span="24">
          <el-form-item label="底图瓦片来源 (Map Source)">
            <el-radio-group v-model="formData['gis.map.source']" class="card-radio-group">
              <el-radio-button label="amap">
                <div class="radio-content">
                  <el-icon><LocationInformation /></el-icon>
                  <strong>高德地图</strong>
                </div>
              </el-radio-button>
              <el-radio-button label="baidu">
                <div class="radio-content">
                  <el-icon><MapLocation /></el-icon>
                  <strong>百度地图</strong>
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
        
        <el-col :span="24" v-if="formData['gis.map.source'] === 'amap'">
          <el-form-item label="高德地图 Web端(JS API) Key">
            <el-input v-model="formData['gis.map.amap.key']" placeholder="请输入高德地图 Key (例如：5b...)" size="large" />
            <div class="el-upload__tip">前往高德开放平台申请 Web端(JS API) Key。</div>
          </el-form-item>
        </el-col>
        
        <el-col :span="24" v-if="formData['gis.map.source'] === 'amap'">
          <el-form-item label="高德地图 Web端安全密钥 (Security Js Code)">
            <el-input v-model="formData['gis.map.amap.security']" placeholder="请输入高德地图配套的安全密钥" size="large" />
            <div class="el-upload__tip text-warning">自2021年12月02日后申请的Key必须配置安全密钥，否则将报 "Error key" 错误导致地图白屏。</div>
          </el-form-item>
        </el-col>

        <el-col :span="24" v-if="formData['gis.map.source'] === 'baidu'">
          <el-form-item label="百度地图浏览器端 AK">
            <el-input v-model="formData['gis.map.baidu.key']" placeholder="请输入百度地图 AK" size="large" />
            <div class="el-upload__tip">前往百度地图开放平台申请浏览器端 AK。</div>
          </el-form-item>
        </el-col>

        <el-col :span="24" v-if="formData['gis.map.source'] === 'tianditu'">
          <el-form-item label="天地图开发者 Key">
            <el-input v-model="formData['gis.map.tianditu.key']" placeholder="请输入天地图 Key" size="large" />
            <div class="el-upload__tip">前往国家地理信息公共服务平台申请开发者 Key。</div>
          </el-form-item>
        </el-col>
        
        <el-col :span="24">
          <el-form-item label="GIS地图主题风格 (Map Style)">
            <el-select v-model="formData['gis.map.style']" size="large" style="width: 100%" placeholder="请选择或输入主题风格" allow-create filterable>
              <el-option label="默认白色/浅色 (Light)" value="amap://styles/light" />
              <el-option label="暗黑科技蓝 (Dark Blue)" value="amap://styles/darkblue" />
              <el-option label="经典暗黑 (Dark)" value="amap://styles/dark" />
              <el-option label="远山黛 (Fresh)" value="amap://styles/fresh" />
              <el-option label="马卡龙 (Macaron)" value="amap://styles/macaron" />
            </el-select>
            <div class="el-upload__tip">设置地图的主题风格。高德地图默认提供 light/dark/darkblue 等，也可直接输入自定义的主题ID。</div>
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

        <el-col :span="8">
          <el-form-item label="默认中心经度 (Lng)">
            <el-input v-model="formData['gis.map.center.lng']" placeholder="例如：118.60" size="large" />
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-form-item label="默认中心纬度 (Lat)">
            <el-input v-model="formData['gis.map.center.lat']" placeholder="例如：24.90" size="large" />
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-form-item label="默认缩放级别 (Zoom)">
            <el-input-number v-model="formData['gis.map.zoom']" :min="1" :max="20" size="large" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
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
  'gis.map.source', 'gis.coord.transform', 'gis.custom.proj4',
  'gis.map.amap.key', 'gis.map.amap.security', 'gis.map.baidu.key', 'gis.map.tianditu.key', 'gis.map.style',
  'gis.map.center.lng', 'gis.map.center.lat', 'gis.map.zoom'
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
    
    // 初始化默认值
    if (formData.value['gis.map.source'] === undefined) formData.value['gis.map.source'] = 'amap'
    if (formData.value['gis.map.style'] === undefined) formData.value['gis.map.style'] = 'amap://styles/light'
    if (formData.value['gis.coord.transform'] === undefined) formData.value['gis.coord.transform'] = 'none'
    if (formData.value['gis.map.center.lng'] === undefined) formData.value['gis.map.center.lng'] = '118.60'
    if (formData.value['gis.map.center.lat'] === undefined) formData.value['gis.map.center.lat'] = '24.90'
    if (formData.value['gis.map.zoom'] === undefined) formData.value['gis.map.zoom'] = 12
    else formData.value['gis.map.zoom'] = Number(formData.value['gis.map.zoom'])
    if (formData.value['gis.custom.proj4'] === undefined) formData.value['gis.custom.proj4'] = '+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=39500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
    
    if (formData.value['gis.map.amap.key'] === undefined) formData.value['gis.map.amap.key'] = ''
    if (formData.value['gis.map.amap.security'] === undefined) formData.value['gis.map.amap.security'] = ''
    if (formData.value['gis.map.baidu.key'] === undefined) formData.value['gis.map.baidu.key'] = ''
    if (formData.value['gis.map.tianditu.key'] === undefined) formData.value['gis.map.tianditu.key'] = ''

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
      if (key === 'gis.map.amap.key') name = '高德地图Key'
      if (key === 'gis.map.amap.security') name = '高德地图安全密钥'
      if (key === 'gis.map.baidu.key') name = '百度地图AK'
      if (key === 'gis.map.tianditu.key') name = '天地图Key'
      if (key === 'gis.map.style') name = 'GIS地图主题风格'
      if (key === 'gis.map.center.lng') name = 'GIS默认中心经度'
      if (key === 'gis.map.center.lat') name = 'GIS默认中心纬度'
      if (key === 'gis.map.zoom') name = 'GIS默认缩放级别'
      
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
  padding: 10px 20px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.form-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .header-left {
    h3 { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px 0; }
    p { color: #6b7280; font-size: 14px; margin: 0; }
  }
}

.premium-form {
  .el-form-item__label { font-weight: 500; color: #374151; padding-bottom: 8px; }
  :deep(.el-input__wrapper), :deep(.el-textarea__inner) {
    border-radius: 8px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #d1d5db inset !important;
    transition: all 0.2s;
    &:hover { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #9ca3af inset !important; }
    &.is-focus, &:focus { box-shadow: 0 0 0 1px var(--el-color-primary) inset !important; }
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
  display: none;
}

.btn-primary {
  border-radius: 6px;
  font-weight: 500;
  padding: 8px 20px;
}
</style>
