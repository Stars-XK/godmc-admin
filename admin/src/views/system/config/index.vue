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

      <el-tab-pane name="dma">
        <template #label><div class="tab-label"><el-icon><DataAnalysis /></el-icon><span>DMA业务配置</span></div></template>
        <dma-config-form v-if="activeTab === 'dma'" />
      </el-tab-pane>

      <el-tab-pane name="gis">
        <template #label><div class="tab-label"><el-icon><MapLocation /></el-icon><span>GIS地图配置</span></div></template>
        <gis-config-form v-if="activeTab === 'gis'" />
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
import DmaConfigForm from './components/DmaConfigForm.vue'
import GisConfigForm from './components/GisConfigForm.vue'
import StorageConfigForm from './components/StorageConfigForm.vue'
import BackupModule from './components/BackupModule.vue'
import ConfigList from './components/ConfigList.vue'
import ConfigDialog from './components/ConfigDialog.vue'
import { DataAnalysis, MapLocation } from '@element-plus/icons-vue'

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
  padding: 32px 40px !important; min-height: calc(100vh - 84px);
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
