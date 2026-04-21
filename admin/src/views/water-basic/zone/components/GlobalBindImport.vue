<template>
  <el-dialog
    :title="title"
    v-model="visible"
    width="500px"
    append-to-body
    destroy-on-close
    class="modern-import-dialog"
    @close="handleClose"
  >
    <div class="import-body">
      <!-- 提示区域 -->
      <div class="info-alert">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
        <div class="info-text">
          <p>请先下载 <strong>{{ templateName }}</strong></p>
          <span v-if="type === 'metric'">在模板中填入分区编码、指标类型、测点编码和计算符号(1为进水/-1为出水)后上传。</span>
          <span v-else>在模板中填入对应的分区编码与{{ type === 'device' ? '设备' : '用户' }}编码后上传。系统会自动匹配更新关联关系。</span>
        </div>
      </div>

      <!-- 操作区域 -->
      <div class="upload-section">
        <div class="step-label">1. 获取模板</div>
        <el-button type="primary" plain class="download-btn" @click="downloadTemplate">
          <el-icon><Download /></el-icon> 下载关联模板
        </el-button>

        <div class="step-label mt-4">2. 上传文件</div>
        <el-upload
          class="upload-dragger"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          accept=".xls,.xlsx"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip text-center">仅允许导入 xls、xlsx 格式文件</div>
          </template>
        </el-upload>
      </div>
      
      <!-- 选中文件状态 -->
      <div v-if="selectedFile" class="selected-file-info">
        <el-icon class="excel-icon"><Document /></el-icon>
        <span class="file-name">{{ selectedFile.name }}</span>
        <el-icon class="remove-file" @click="removeFile"><Close /></el-icon>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取 消</el-button>
        <el-button type="primary" :loading="isUploading" :disabled="!selectedFile" @click="submitImport">
          开始导入关联
        </el-button>
      </div>
    </template>

    <!-- 进度弹窗 -->
    <div v-if="isUploading" class="progress-overlay">
      <div class="progress-card">
        <el-icon class="loading-icon is-loading"><Loading /></el-icon>
        <h3 class="progress-title">正在处理关联数据...</h3>
        <p class="progress-desc">请勿关闭窗口，共解析 {{ totalRows }} 条记录</p>
        <el-progress :percentage="progress" :stroke-width="12" striped stroke-linecap="round" />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { download } from '@/utils/request'
import * as XLSX from 'xlsx'
import { importGlobalBindDevices, importGlobalBindRevenueUsers, importGlobalBindMetrics } from '@/api/water-basic/zone-bind'

const props = defineProps({
  modelValue: Boolean,
  type: {
    type: String,
    default: 'device' // 'device' 或 'revenue' 或 'metric'
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const title = computed(() => {
  if (props.type === 'device') return '批量导入设备关联'
  if (props.type === 'revenue') return '批量导入营收关联'
  if (props.type === 'metric') return '批量导入指标计算配置'
  return '批量导入'
})

const templateName = computed(() => {
  if (props.type === 'device') return '全局设备关联模板.xlsx'
  if (props.type === 'revenue') return '全局营收关联模板.xlsx'
  if (props.type === 'metric') return '全局指标测点配置模板.xlsx'
  return '关联模板.xlsx'
})

const selectedFile = ref(null)
const isUploading = ref(false)
const progress = ref(0)
const totalRows = ref(0)

function handleClose() {
  selectedFile.value = null
  isUploading.value = false
  progress.value = 0
}

function removeFile() {
  selectedFile.value = null
}

function downloadTemplate() {
  if (props.type === 'device') {
    download('/water-basic/zone/global-bind/device/template', {}, templateName.value)
  } else if (props.type === 'revenue') {
    download('/water-basic/zone/global-bind/revenue/template', {}, templateName.value)
  } else if (props.type === 'metric') {
    download('/water-basic/zone/global-bind/metric/template', {}, templateName.value)
  }
}

function handleFileChange(file) {
  const rawFile = file.raw
  if (!rawFile.name.endsWith('.xls') && !rawFile.name.endsWith('.xlsx')) {
    ElMessage.error('只能上传 Excel 文件')
    return false
  }
  selectedFile.value = rawFile
  return false
}

async function submitImport() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择要上传的 Excel 文件')
    return
  }

  isUploading.value = true
  progress.value = 10
  totalRows.value = 0

  try {
    const data = await readFile(selectedFile.value)
    if (!data || data.length === 0) {
      throw new Error('未解析到数据，请检查文件是否为空')
    }

    totalRows.value = data.length
    progress.value = 40

    let res
    if (props.type === 'device') {
      res = await importGlobalBindDevices(data)
    } else if (props.type === 'revenue') {
      res = await importGlobalBindRevenueUsers(data)
    } else if (props.type === 'metric') {
      res = await importGlobalBindMetrics(data)
    }

    progress.value = 100

    if (res.code === 200) {
      const { successCount, failCount, results } = res.data || {}
      if (failCount > 0) {
        ElNotification({
          title: '导入完成',
          message: `成功: ${successCount} 条，失败: ${failCount} 条。请检查部分未匹配的数据。`,
          type: 'warning',
          duration: 0
        })
      } else {
        ElMessage.success(`导入成功，共处理 ${successCount} 条数据！`)
      }
      emit('success')
      visible.value = false
    } else {
      ElMessage.error(res.msg || '导入失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '文件解析或导入失败')
  } finally {
    isUploading.value = false
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const results = XLSX.utils.sheet_to_json(worksheet)
        resolve(results)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = (err) => reject(err)
    reader.readAsBinaryString(file)
  })
}
</script>

<style scoped>
.modern-import-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.modern-import-dialog :deep(.el-dialog__header) {
  margin: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fafafa;
}

.modern-import-dialog :deep(.el-dialog__title) {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.import-body {
  padding: 10px 0;
}

/* 提示信息区域 */
.info-alert {
  display: flex;
  background-color: #f0f7ff;
  border: 1px solid #cce5ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.info-icon {
  font-size: 20px;
  color: #409EFF;
  margin-right: 12px;
  margin-top: 2px;
}

.info-text p {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #303133;
}

.info-text span {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

/* 步骤与上传区域 */
.step-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.mt-4 {
  margin-top: 24px;
}

.download-btn {
  width: 100%;
  justify-content: center;
  border-radius: 8px;
  height: 38px;
}

.upload-dragger :deep(.el-upload-dragger) {
  border-radius: 8px;
  background-color: #fafbfc;
  transition: all 0.3s;
}

.upload-dragger :deep(.el-upload-dragger:hover) {
  background-color: #f0f7ff;
  border-color: #409EFF;
}

/* 选中文件状态 */
.selected-file-info {
  display: flex;
  align-items: center;
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #f4f4f5;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
}

.excel-icon {
  color: #67C23A;
  font-size: 18px;
  margin-right: 8px;
}

.file-name {
  flex: 1;
  font-size: 14px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-file {
  color: #F56C6C;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.remove-file:hover {
  background-color: #fee;
}

/* 底部操作 */
.dialog-footer {
  padding-top: 10px;
}

.dialog-footer .el-button {
  border-radius: 6px;
  padding: 8px 20px;
}

/* 进度条蒙层 */
.progress-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  z-index: 3000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-card {
  width: 320px;
  text-align: center;
}

.loading-icon {
  font-size: 48px;
  color: #409EFF;
  margin-bottom: 16px;
}

.progress-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
}

.progress-desc {
  font-size: 13px;
  color: #909399;
  margin: 0 0 24px;
}
</style>
