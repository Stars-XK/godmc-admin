<template>
  <el-drawer
    :title="`关联营收基础用户 - ${zoneName}`"
    v-model="visible"
    direction="rtl"
    size="1000px"
    @close="handleClose"
    append-to-body
    class="custom-drawer"
  >
    <el-tabs v-model="activeTab" class="bind-tabs">
      <!-- 模式1：手动勾选关联 -->
      <el-tab-pane label="手动勾选关联" name="manual">
        <div class="manual-container">
          <div class="filter-bar">
            <el-form :model="queryParams" ref="queryRef" :inline="true">
              <el-form-item label="用户编号" prop="userNo">
                <el-input v-model="queryParams.userNo" placeholder="请输入编号" clearable style="width: 150px" @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="用户名称" prop="name">
                <el-input v-model="queryParams.name" placeholder="请输入名称" clearable style="width: 150px" @keyup.enter="handleQuery" />
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
          
          <el-alert title="列表中仅显示当前未关联任何分区的独立营收用户" type="info" show-icon style="margin-bottom: 15px; border-radius: 8px;" />

          <div class="table-wrapper">
            <el-table
              v-loading="loading"
              :data="userList"
              @selection-change="handleSelectionChange"
              height="100%"
              style="width: 100%"
            >
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="用户编号" prop="userNo" width="150" />
              <el-table-column label="用户名称" prop="userName" show-overflow-tooltip />
              <el-table-column label="用户分类" prop="userCategory" width="180">
                <template #default="scope">
                  <dict-tag :options="water_user_category" :value="scope.row.userCategory" />
                </template>
              </el-table-column>
              <el-table-column label="手机号" prop="phone" width="120" />
              <el-table-column label="详细地址" prop="address" show-overflow-tooltip />
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
      </el-tab-pane>

      <!-- 模式2：批量导入关联 -->
      <el-tab-pane label="批量导入关联" name="import">
        <div class="import-container">
          <el-alert title="请上传包含【用户编号】列的 Excel 文件进行批量关联。" type="warning" show-icon style="margin-bottom: 20px;" />
          
          <el-form label-position="top">
            <el-form-item label="关联模式（必选）">
              <el-radio-group v-model="importMode">
                <el-radio label="append" border>增量追加（保留该分区现有用户）</el-radio>
                <el-radio label="replace" border>覆盖替换（先清空该分区下所有用户）</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-alert
              title="模式说明：追加=保留现有关联，仅新增本次导入/勾选的用户；替换=先解绑该分区下所有用户，再按本次导入/勾选重新绑定。"
              type="info"
              show-icon
              style="margin-bottom: 12px;"
            />
            
            <el-form-item label="上传文件">
              <div class="upload-wrapper">
                <div class="upload-zone" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
                  <el-icon class="upload-icon"><UploadFilled /></el-icon>
                  <h3>点击或拖拽 Excel 文件到此区域</h3>
                  <p style="color: #909399; font-size: 13px; margin-top: 8px;">仅支持 .xls, .xlsx 格式文件</p>
                  <input type="file" ref="fileInputRef" accept=".xls,.xlsx" class="hidden-input" @change="handleFileChange" />
                </div>
                <el-button type="primary" plain icon="Download" @click="downloadTemplate" style="width: 200px; margin-top: 10px;">
                  下载导入模板
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 进度覆盖层 -->
    <div v-if="isUploading" class="progress-overlay">
      <div class="progress-card">
        <div class="pulse-ring"></div>
        <el-icon class="loading-icon is-loading"><Loading /></el-icon>
        <h3 class="progress-title">营收用户关联导入中</h3>
        <p class="progress-desc">正在处理 {{ totalRows }} 条记录，请勿刷新页面...</p>
        <el-progress :percentage="progress" :stroke-width="12" striped striped-flow class="modern-progress"></el-progress>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, watch, getCurrentInstance } from 'vue'
import { getUnboundRevenueList, bindRevenueUsers, importBindRevenueUsers } from '@/api/water-basic/zone-bind'
import * as XLSX from 'xlsx'

const props = defineProps({
  modelValue: Boolean,
  zoneCode: String,
  zoneName: String
})

const emit = defineEmits(['update:modelValue', 'success'])
const { proxy } = getCurrentInstance()
const { water_user_category } = proxy.useDict('water_user_category')

const visible = ref(false)
const activeTab = ref('manual')
const loading = ref(false)
const userList = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const pageSizes = [20, 50, 100, 200, 500]
const selectedIds = ref([])
const queryParams = ref({ name: undefined, userNo: undefined })

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
  userList.value = []
  queryParams.value = { name: undefined, userNo: undefined }
}

function handleQuery() {
  pageNum.value = 1
  getList()
}

async function getList() {
  loading.value = true
  try {
    const res = await getUnboundRevenueList({
      ...queryParams.value,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    const data = res.data || {}
    userList.value = data.list || []
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
  bindRevenueUsers({ zoneCode: props.zoneCode, userIds: selectedIds.value }).then(() => {
    proxy.$modal.msgSuccess('手动绑定成功')
    emit('success')
    getList()
  })
}

function downloadTemplate() {
  proxy.download('/water-basic/zone/bind/revenue/template', {}, `营收关联模板_${new Date().getTime()}.xlsx`)
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
    proxy.$modal.confirm('覆盖替换：将先解绑该分区下所有已关联营收用户，再按本次文件重新绑定。是否继续？').then(() => {
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

      const parsedData = jsonArr.map(row => ({ userNo: row['用户编号'] || '' }))

      progress.value = 60
      const res = await importBindRevenueUsers({
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
    '用户编号': item.userNo,
    '关联结果': item.success ? '成功' : '失败',
    '原因说明': item.reason
  }))
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "关联结果")
  XLSX.writeFile(wb, `营收用户关联结果分析_${new Date().getTime()}.xlsx`)
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
  height: calc(100vh - 120px);
}
.table-wrapper {
  flex: 1;
  min-height: 0; /* 必须加这个，防止 flex 子项溢出 */
}
.bind-tabs {
  padding: 0 20px;
  height: 100%;
}
.bind-tabs :deep(.el-tabs__content) {
  height: calc(100% - 60px);
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
