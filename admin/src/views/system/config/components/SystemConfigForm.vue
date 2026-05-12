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
            <el-input v-model="formData['sys.web.siteName']" placeholder="例如：智慧水务" size="large" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="网站标题">
            <el-input v-model="formData['sys.web.title']" placeholder="例如：智慧水务 IoT 管理平台" size="large" />
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
            <el-color-picker v-model="formData['sys.web.primaryColor']" size="large" @change="onColorChange" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="全局皮肤">
            <el-select v-model="formData['sys.index.skinName']" size="large" style="width: 100%" @change="onSkinChange">
              <el-option label="水务青 (skin-blue)" value="skin-blue" />
              <el-option label="翡翠绿 (skin-green)" value="skin-green" />
              <el-option label="优雅紫 (skin-purple)" value="skin-purple" />
              <el-option label="热情红 (skin-red)" value="skin-red" />
              <el-option label="明亮黄 (skin-yellow)" value="skin-yellow" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="侧边栏主题">
            <el-select v-model="formData['sys.index.sideTheme']" size="large" style="width: 100%" @change="onSideThemeChange">
              <el-option label="深色主题 (theme-dark)" value="theme-dark" />
              <el-option label="浅色主题 (theme-light)" value="theme-light" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <div class="form-actions">
        <el-button type="primary" size="large" @click="handleSave" :loading="saving" class="btn-primary">保存配置</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import { listConfig, updateConfig, addConfig } from '@/api/system/config'
import { handleThemeStyle } from '@/utils/theme'
import { useDynamicTitle } from '@/utils/dynamicTitle'
import useSettingsStore from '@/store/modules/settings'

const { proxy } = getCurrentInstance()
const loading = ref(true)
const saving = ref(false)

const targetKeys = [
  'sys.web.siteName', 'sys.web.title', 'sys.web.description', 'sys.web.logo', 
  'sys.web.primaryColor', 'sys.index.skinName', 'sys.index.sideTheme'
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
    loading.value = false
  }).catch(() => { loading.value = false })
}

// 颜色选择器即时预览
function onColorChange(color) {
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
    handleThemeStyle(color)
  }
}

// 皮肤即时预览
function onSkinChange(skin) {
  const skinColorMap = {
    'skin-blue': '#0D9488',
    'skin-green': '#10B981',
    'skin-purple': '#8B5CF6',
    'skin-red': '#EF4444',
    'skin-yellow': '#F59E0B',
  }
  const color = skinColorMap[skin]
  if (color) {
    formData.value['sys.web.primaryColor'] = color
    handleThemeStyle(color)
  }
}

// 侧边栏主题即时预览
function onSideThemeChange(theme) {
  useSettingsStore().changeSetting({ key: 'sideTheme', value: theme })
}

function applyConfig() {
  const settingsStore = useSettingsStore()

  if (formData.value['sys.web.siteName']) {
    settingsStore.setTitle(formData.value['sys.web.siteName'])
  }

  if (formData.value['sys.web.title']) {
    document.title = formData.value['sys.web.title']
    useDynamicTitle()
  }

  const primaryColor = formData.value['sys.web.primaryColor']
  if (primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
    settingsStore.changeSetting({ key: 'theme', value: primaryColor })
    handleThemeStyle(primaryColor)
  }

  const sideTheme = formData.value['sys.index.sideTheme']
  if (sideTheme) {
    settingsStore.changeSetting({ key: 'sideTheme', value: sideTheme })
  }

  // 同步到 localStorage
  const layoutSetting = {
    topNav: settingsStore.topNav,
    tagsView: settingsStore.tagsView,
    fixedHeader: settingsStore.fixedHeader,
    sidebarLogo: settingsStore.sidebarLogo,
    dynamicTitle: settingsStore.dynamicTitle,
    sideTheme: settingsStore.sideTheme,
    theme: settingsStore.theme,
  }
  localStorage.setItem('layout-setting', JSON.stringify(layoutSetting))
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
      if (key === 'sys.web.siteName') name = '网站名称'
      if (key === 'sys.web.title') name = '网站标题'
      if (key === 'sys.web.description') name = '网站描述'
      if (key === 'sys.web.logo') name = '网站Logo'
      if (key === 'sys.web.primaryColor') name = '系统主色调'
      if (key === 'sys.index.skinName') name = '全局皮肤'
      if (key === 'sys.index.sideTheme') name = '侧边栏主题'
      
      payload = { configName: name, configKey: key, configValue: formData.value[key], configType: 'Y', remark: '系统基础配置' }
      promises.push(addConfig(payload))
    }
  })
  
  Promise.all(promises).then(() => {
    proxy.$modal.msgSuccess('基础系统配置保存成功')
    // 保存后立即应用主题配置
    applyConfig()
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
  background: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
}

.form-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #F1F5F9;
  
  h3 { font-size: 18px; font-weight: 600; color: #0F172A; margin: 0 0 8px 0; }
  p { color: #64748B; font-size: 14px; margin: 0; }
}

.premium-form {
  .el-form-item__label { font-weight: 500; color: #334155; padding-bottom: 8px; }
  :deep(.el-input__wrapper), :deep(.el-textarea__inner) {
    border-radius: 8px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #CBD5E1 inset !important;
    transition: all 0.2s;
    &:hover { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px #94A3B8 inset !important; }
    &.is-focus, &:focus { box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.3) inset !important; }
  }
}

.form-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #F1F5F9;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  border-radius: 8px;
  font-weight: 500;
  background: linear-gradient(135deg, #0D9488, #0F766E);
  border: none;
  &:hover {
    background: linear-gradient(135deg, #14B8A6, #0D9488);
  }
}
</style>
