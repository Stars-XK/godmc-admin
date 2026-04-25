<template>
  <div class="config-form-container">
    <div class="form-header">
      <h3>DMA 业务系统配置</h3>
      <p>设置水务DMA系统的全局业务参数，包括夜间最小流量的统计时段以及产销差营收数据的计算策略等。</p>
    </div>
    
    <el-form ref="formRef" :model="formData" label-position="top" class="premium-form" v-loading="loading">
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="夜间最小流量起始时间">
            <el-time-select
              v-model="formData['zone.night.flow.start']"
              start="00:00"
              step="00:30"
              end="23:30"
              placeholder="例如：02:00"
              size="large"
              style="width: 100%"
            />
            <div class="el-upload__tip">统计当天夜间最小流量的起始时段，通常在凌晨用水低谷期。</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="夜间最小流量结束时间">
            <el-time-select
              v-model="formData['zone.night.flow.end']"
              start="00:00"
              step="00:30"
              end="23:30"
              placeholder="例如：04:00"
              size="large"
              style="width: 100%"
            />
            <div class="el-upload__tip">统计当天夜间最小流量的结束时段。</div>
          </el-form-item>
        </el-col>
        
        <el-col :span="24">
          <el-form-item label="营收数据计算方式">
            <el-radio-group v-model="formData['revenue.calc.strategy']" class="full-width-radio">
              <el-radio-button label="day_to_month">
                <div class="radio-content">
                  <strong>通过日计算月 (Day to Month)</strong>
                  <span class="desc">将每日记录的营收用量累加，得出每月的总售水量。适用于高频抄表的智能水表。</span>
                </div>
              </el-radio-button>
              <el-radio-button label="month_to_day">
                <div class="radio-content">
                  <strong>通过月计算日 (Month to Day)</strong>
                  <span class="desc">按月度账单用量进行线性平滑（插值）分配到每天。适用于人工抄表或低频水表。</span>
                </div>
              </el-radio-button>
              <el-radio-button label="independent">
                <div class="radio-content">
                  <strong>分开计算独立存储 (Independent)</strong>
                  <span class="desc">日用量与月用量各自独立，不做强制换算，产销差直接使用各自维度的数据。</span>
                </div>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>

      </el-row>
      
      <div class="form-actions">
        <el-button type="primary" size="large" @click="handleSave" :loading="saving" class="btn-primary">保存业务配置</el-button>
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
  'zone.night.flow.start', 'zone.night.flow.end', 'revenue.calc.strategy'
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
    if (formData.value['zone.night.flow.start'] === undefined) formData.value['zone.night.flow.start'] = '02:00'
    if (formData.value['zone.night.flow.end'] === undefined) formData.value['zone.night.flow.end'] = '04:00'
    if (formData.value['revenue.calc.strategy'] === undefined) formData.value['revenue.calc.strategy'] = 'month_to_day'
    
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
      if (key === 'zone.night.flow.start') name = '夜间最小流量起始时间'
      if (key === 'zone.night.flow.end') name = '夜间最小流量结束时间'
      if (key === 'revenue.calc.strategy') name = '营收计算策略'
      
      payload = { configName: name, configKey: key, configValue: formData.value[key], configType: 'Y', remark: 'DMA业务自动生成配置' }
      promises.push(addConfig(payload))
    }
  })
  
  Promise.all(promises).then(() => {
    proxy.$modal.msgSuccess('DMA业务系统配置保存成功')
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

.full-width-radio {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  
  :deep(.el-radio-button) {
    width: 100%;
    
    .el-radio-button__inner {
      width: 100%;
      border-radius: 8px !important;
      border: 1px solid #d1d5db !important;
      padding: 16px;
      text-align: left;
      box-shadow: none !important;
      
      &:hover { color: #111827; border-color: #9ca3af !important; background-color: #f9fafb; }
    }
    
    &.is-active .el-radio-button__inner {
      background-color: #f0fdf4 !important;
      border-color: #22c55e !important;
      color: #166534;
      box-shadow: 0 0 0 1px #22c55e !important;
    }
  }
}

.radio-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  strong { font-size: 15px; }
  .desc { font-size: 13px; color: #6b7280; font-weight: normal; }
}
:deep(.is-active) .radio-content .desc { color: #166534; opacity: 0.8; }

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
