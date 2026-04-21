<template>
  <el-drawer
    :title="`关联设备台账 - ${zoneName}`"
    v-model="visible"
    direction="rtl"
    size="1200px"
    @close="handleClose"
    append-to-body
    class="custom-drawer"
  >
    <div class="manual-container">
      <div class="filter-bar">
        <el-form :model="queryParams" ref="queryRef" :inline="true">
          <el-form-item label="设备编码" prop="code">
            <el-input v-model="queryParams.code" placeholder="请输入编码" clearable style="width: 150px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="设备名称" prop="name">
            <el-input v-model="queryParams.name" placeholder="请输入名称" clearable style="width: 150px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="设备类型" prop="type">
            <el-select v-model="queryParams.type" placeholder="请选择设备类型" clearable style="width: 150px" @change="handleQuery">
              <el-option
                v-for="dict in water_device_type"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          </el-form-item>
        </el-form>
        <div class="action-btn">
          <el-button type="primary" size="default" :disabled="!selectedIds.length" @click="submitManualBind">
            <el-icon style="margin-right: 4px"><Link /></el-icon>
            确认绑定 ({{ selectedIds.length }})
          </el-button>
        </div>
      </div>
      
      <el-alert title="列表中仅显示当前未关联任何分区的独立设备" type="info" show-icon style="margin-bottom: 15px; border-radius: 8px;" />

      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="deviceList"
          @selection-change="handleSelectionChange"
          height="100%"
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="设备编码" prop="code" width="150" />
          <el-table-column label="设备名称" prop="name" show-overflow-tooltip />
          <el-table-column label="设备类型" prop="type" width="100">
            <template #default="scope">
              <dict-tag :options="water_device_type" :value="scope.row.type" />
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" prop="manufacturer" show-overflow-tooltip />
        </el-table>
      </div>

      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="pageNum"
        v-model:limit="pageSize"
        :page-sizes="pageSizes"
        @pagination="getList"
      />
    </div>

    <!-- 进度覆盖层 -->
    <div v-if="isUploading" class="progress-overlay">
      <div class="progress-card">
        <div class="pulse-ring"></div>
        <el-icon class="loading-icon is-loading"><Loading /></el-icon>
        <h3 class="progress-title">设备关联处理中</h3>
        <p class="progress-desc">正在处理，请勿刷新页面...</p>
        <el-progress :percentage="progress" :stroke-width="12" striped striped-flow class="modern-progress"></el-progress>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, watch, getCurrentInstance } from 'vue'
import { getUnboundDeviceList, bindDevices } from '@/api/water-basic/zone-bind'
import * as XLSX from 'xlsx'

const props = defineProps({
  modelValue: Boolean,
  zoneCode: String,
  zoneName: String
})

const emit = defineEmits(['update:modelValue', 'success'])
const { proxy } = getCurrentInstance()
const { water_device_type } = proxy.useDict('water_device_type')

const visible = ref(false)
const activeTab = ref('manual')
const loading = ref(false)
const deviceList = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const pageSizes = [20, 50, 100, 200, 500]
const selectedIds = ref([])
const queryParams = ref({ name: undefined, code: undefined, type: undefined })

// 导入相关
const importMode = ref('append')
const fileInputRef = ref(null)
const isUploading = ref(false)
const progress = ref(0)
const totalRows = ref(0)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    activeTab.value = 'manual'
    importMode.value = 'append'
    pageNum.value = 1
    pageSize.value = 20
    selectedIds.value = []
    getList()
  }
})

function handleClose() {
  emit('update:modelValue', false)
  deviceList.value = []
  queryParams.value = { name: undefined, code: undefined, type: undefined }
}

function handleQuery() {
  pageNum.value = 1
  getList()
}

async function getList() {
  loading.value = true
  try {
    const res = await getUnboundDeviceList({
      ...queryParams.value,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    const data = res.data || {}
    deviceList.value = data.list || []
    total.value = data.total || 0
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(item => item.id)
}

function submitManualBind() {
  bindDevices({ zoneCode: props.zoneCode, deviceIds: selectedIds.value }).then(() => {
    proxy.$modal.msgSuccess('手动绑定成功')
    emit('success')
    getList() // 重新刷新列表，已绑定的会消失
  })
}

function downloadTemplate() {
  proxy.download('/water-basic/zone/bind/device/template', {}, `设备关联模板_${new Date().getTime()}.xlsx`)
}

// ============== 极速导入解析 ==============
function triggerFileInput() {
  if (fileInputRef.value) fileInputRef.value.click()
}

function handleDrop(e) {
  const files = e.dataTransfer.files
  if (files.length) processFile(files[0])
}

function handleFileChange(e) {
  const files = e.target.files
  if (files.length) processFile(files[0])
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function processFile(file) {
  if (!/\.(xls|xlsx)$/.test(file.name.toLowerCase())) {
    proxy.$modal.msgError("仅支持 xls, xlsx 格式的文件")
    return
  }

  if (importMode.value === 'replace') {
    proxy.$modal.confirm('覆盖替换：将先解绑该分区下所有已关联设备，再按本次文件重新绑定。是否继续？').then(() => {
      startImport(file)
    }).catch(() => {})
    return
  }

  startImport(file)
}

function startImport(file) {
  isUploading.value = true
  progress.value = 10
  
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      progress.value = 30
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonArr = XLSX.utils.sheet_to_json(worksheet)
      
      totalRows.value = jsonArr.length
      progress.value = 50
      if (jsonArr.length === 0) throw new Error('上传的文件没有数据')

      const parsedData = jsonArr.map(row => ({ code: row['设备编码'] || '' }))

      progress.value = 60
      const res = await importBindDevices({
        zoneCode: props.zoneCode,
        mode: importMode.value,
        dataList: parsedData
      })
      
      progress.value = 100
      setTimeout(() => {
        isUploading.value = false
        handleImportResult(res.data)
      }, 500)
      
    } catch (err) {
      isUploading.value = false
      proxy.$modal.msgError(err.message || "解析文件失败")
    }
  }
  reader.onerror = () => {
    isUploading.value = false
    proxy.$modal.msgError("读取文件出错")
  }
  reader.readAsArrayBuffer(file)
}

function handleImportResult(data) {
  const { successCount, failCount, results } = data
  proxy.$modal.notifySuccess(`成功关联 ${successCount} 条，失败 ${failCount} 条`)
  
  if (failCount > 0 && results && results.length > 0) {
    proxy.$modal.confirm('存在未成功关联的记录，是否下载《关联结果分析报告》查看原因？', '导入完成提示', {
      confirmButtonText: '下载报告',
      cancelButtonText: '关闭'
    }).then(() => {
      exportResultExcel(results)
    }).catch(() => {})
  }
  
  emit('success')
  if (activeTab.value === 'manual') getList()
}

function exportResultExcel(results) {
  const exportData = results.map(item => ({
    '设备编码': item.code,
    '关联结果': item.success ? '成功' : '失败',
    '原因说明': item.reason
  }))
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "关联结果")
  XLSX.writeFile(wb, `设备关联结果分析_${new Date().getTime()}.xlsx`)
}
</script>

<style scoped>
/* 现代化的 Tab 样式 */
.bind-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
}
.bind-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s;
}
.bind-tabs :deep(.el-tabs__item.is-active) {
  font-size: 16px;
  font-weight: 600;
}

/* 搜索和操作组合栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #f8f9fa;
  padding: 16px 16px 0 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
}

.action-btn .el-button {
  height: 32px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
  transition: all 0.3s;
}
.action-btn .el-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.manual-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.table-wrapper {
  flex: 1;
  min-height: 0; /* 必须加这个，防止 flex 子项溢出 */
  margin-bottom: 10px;
}
.bind-tabs {
  padding: 0 20px;
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}
.bind-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
}
.bind-tabs :deep(.el-tab-pane) {
  height: 100%;
}
.upload-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  margin-top: 10px;
}
.upload-zone {
  width: 100%;
  max-width: 500px;
  border: 2px dashed #dcdfe6;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}
.upload-zone:hover {
  border-color: #409EFF;
  background-color: #f0f7ff;
  transform: translateY(-2px);
}
.upload-icon {
  font-size: 54px;
  color: #a8abb2;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}
.upload-zone:hover .upload-icon {
  color: #409EFF;
  transform: scale(1.1);
}
.hidden-input {
  display: none;
}
/* 进度条样式复用 */
.progress-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  z-index: 3000;
  display: flex; justify-content: center; align-items: center;
}
.progress-card {
  width: 400px; background: #fff; border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); padding: 40px; text-align: center;
}
.loading-icon { font-size: 56px; color: #409EFF; margin-bottom: 20px; }
.progress-title { font-size: 20px; font-weight: 600; margin: 0 0 10px; }
.progress-desc { font-size: 14px; color: #909399; margin: 0 0 30px; }
</style>
