<template>
  <div class="pipe-tab full-height-tab">
    <el-row :gutter="20" class="full-height-row">
      <el-col :span="24" class="full-height-col">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
          <el-form-item label="管线名称" prop="name">
            <el-input v-model="queryParams.name" placeholder="请输入管线名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="管线编码" prop="code">
            <el-input v-model="queryParams.code" placeholder="请输入管线编码" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="管线类型" prop="pipeType">
            <el-select v-model="queryParams.pipeType" placeholder="请选择类型" clearable>
              <el-option v-for="dict in water_pipe_type" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['water-basic:pipe:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Upload" @click="handleImport" v-hasPermi="['water-basic:pipe:import']">导入</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['water-basic:pipe:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-row :gutter="12" class="stats-mini-row">
          <el-col :span="4"><div class="mini-stat-card mini-total"><div class="mini-num">{{ stats.total }}</div><div class="mini-label">管线总数</div></div></el-col>
          <el-col :span="4"><div class="mini-stat-card mini-online"><div class="mini-num">{{ stats.active }}</div><div class="mini-label">启用</div></div></el-col>
          <el-col :span="4"><div class="mini-stat-card mini-offline"><div class="mini-num">{{ stats.inactive }}</div><div class="mini-label">停用</div></div></el-col>
        </el-row>

        <el-table v-loading="loading" :data="pipeList" height="100%" class="flex-table">
          <el-table-column type="index" width="50" align="center" />
          <el-table-column label="管线名称" align="left" prop="name" min-width="180">
            <template #default="scope">
              <el-icon class="mr-1" color="#409EFC"><Share /></el-icon>
              <span>{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="管线编码" align="center" prop="code" width="180" />
          <el-table-column label="所属分区" align="center" prop="zoneCode" width="120" />
          <el-table-column label="管线类型" align="center" prop="pipeType" width="120">
            <template #default="scope">
              <dict-tag :options="water_pipe_type" :value="String(scope.row.pipeType)" />
            </template>
          </el-table-column>
          <el-table-column label="管材" align="center" prop="material" width="100" />
          <el-table-column label="管径(mm)" align="center" prop="diameter" width="100" />
          <el-table-column label="长度(m)" align="center" prop="length" width="100" />
          <el-table-column label="起点-终点" align="center" min-width="200">
            <template #default="{ row }">
              <span v-if="row.startNode || row.endNode">{{ row.startNode || '-' }} → {{ row.endNode || '-' }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="埋深(m)" align="center" prop="burialDepth" width="80" />
          <el-table-column label="状态" align="center" prop="status" width="80">
            <template #default="scope">
              <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['water-basic:pipe:edit']">修改</el-button>
              <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['water-basic:pipe:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination class="custom-pagination" v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </el-col>
    </el-row>

    <!-- 添加或修改管线对话框 -->
    <el-dialog :title="title" v-model="open" width="780px" top="5vh" append-to-body class="equip-dialog" destroy-on-close>
      <div class="dialog-scroll">
      <el-form ref="pipeRef" :model="form" :rules="rules" label-width="100px">
        <div class="form-card">
          <div class="card-header">
            <span class="card-dot"></span>
            <el-icon class="card-icon"><Document /></el-icon>
            <span class="card-title">基本信息</span>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="管线名称" prop="name">
                  <el-input v-model="form.name" placeholder="请输入管线名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="管线编码" prop="code">
                  <el-input v-model="form.code" placeholder="请输入管线编码" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="所属分区" prop="zoneCode">
                  <el-input v-model="form.zoneCode" placeholder="请输入分区编码" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="管线类型" prop="pipeType">
                  <el-select v-model="form.pipeType" placeholder="请选择类型" style="width: 100%;">
                    <el-option v-for="dict in water_pipe_type" :key="dict.value" :label="dict.label" :value="dict.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <div class="form-card">
          <div class="card-header">
            <span class="card-dot dot-purple"></span>
            <el-icon class="card-icon"><Share /></el-icon>
            <span class="card-title">管道参数</span>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="管材" prop="material">
                  <el-input v-model="form.material" placeholder="PE/PVC/铸铁/钢管" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="管径(mm)" prop="diameter">
                  <el-input-number v-model="form.diameter" :min="0" :precision="0" :step="50" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="长度(m)" prop="length">
                  <el-input-number v-model="form.length" :min="0" :precision="2" :step="100" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="埋深(m)" prop="burialDepth">
                  <el-input-number v-model="form.burialDepth" :min="0" :precision="2" :step="0.5" style="width: 100%;" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <div class="form-card">
          <div class="card-header">
            <span class="card-dot dot-green"></span>
            <el-icon class="card-icon"><Connection /></el-icon>
            <span class="card-title">连接与施工信息</span>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="起点节点" prop="startNode">
                  <el-input v-model="form.startNode" placeholder="起点连接节点" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="终点节点" prop="endNode">
                  <el-input v-model="form.endNode" placeholder="终点连接节点" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="铺设日期" prop="installDate">
                  <el-date-picker clearable v-model="form.installDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择铺设日期" style="width: 100%;" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="施工单位" prop="constructionUnit">
                  <el-input v-model="form.constructionUnit" placeholder="请输入施工单位" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <div class="form-card">
          <div class="card-header">
            <span class="card-dot dot-orange"></span>
            <el-icon class="card-icon"><Setting /></el-icon>
            <span class="card-title">其他设置</span>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="状态">
                  <el-radio-group v-model="form.status">
                    <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="关联系统用户" prop="userId">
                  <el-select v-model="form.userId" filterable placeholder="选择关联用户" style="width: 100%;" clearable>
                    <el-option v-for="user in userOptions" :key="user.userId" :label="user.userName + (user.nickName ? ' (' + user.nickName + ')' : '')" :value="user.userId" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导入弹窗 -->
    <el-dialog :title="upload.title" v-model="upload.open" width="480px" class="modern-import-dialog" :show-close="false" append-to-body>
      <div class="import-modal-content">
        <div class="upload-zone" @dragover.prevent @drop.prevent="handleDrop" @click="triggerFileInput">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <h3>点击或拖拽 Excel 文件到此区域</h3>
          <p>仅支持 .xls, .xlsx 格式文件，单次建议不超过 5000 条数据</p>
          <input type="file" ref="fileInputRef" accept=".xls,.xlsx" class="hidden-input" @change="handleFileChange" />
        </div>
        <div class="template-download">
          <span>还没有数据模板？</span>
          <el-link type="primary" :underline="false" @click="importTemplate">立即下载模板</el-link>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button round @click="upload.open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 进度覆盖层 -->
    <div v-if="upload.isUploading" class="progress-overlay">
      <div class="progress-card">
        <div class="pulse-ring"></div>
        <el-icon class="loading-icon is-loading"><Loading /></el-icon>
        <h3 class="progress-title">数据解析与导入中</h3>
        <p class="progress-desc">正在处理 {{ upload.totalRows }} 条记录，请勿刷新页面...</p>
        <el-progress
          :percentage="upload.progress"
          :stroke-width="12"
          striped
          striped-flow
          :color="customColors"
          class="modern-progress"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { listPipe, delPipe, getPipe, addPipe, updatePipe, importPipeBatch } from '@/api/water-basic/equipment'
import { listUser } from '@/api/system/user'
import { Document, Share, Connection, Setting } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'

const { proxy } = getCurrentInstance()
const { water_pipe_type, sys_normal_disable } = proxy.useDict('water_pipe_type', 'sys_normal_disable')

const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const userOptions = ref([])
const stats = reactive({ total: 0, active: 0, inactive: 0 })

const pipeList = ref([])

const form = ref({})
const queryParams = ref({ pageNum: 1, pageSize: 20, name: undefined, code: undefined, pipeType: undefined })
const upload = ref({ open: false, title: '', isUploading: false, progress: 0, totalRows: 0 })
const fileInputRef = ref(null)
const customColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 },
]
const rules = {
  name: [{ required: true, message: '管线名称不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '管线编码不能为空', trigger: 'blur' }],
  pipeType: [{ required: true, message: '请选择管线类型', trigger: 'change' }],
}

const open = ref(false)
const title = ref('')

function reset() {
  form.value = {
    id: undefined, name: undefined, code: undefined, zoneCode: undefined, pipeType: 'WATER_SUPPLY',
    material: undefined, diameter: undefined, length: undefined, startNode: undefined, endNode: undefined,
    burialDepth: undefined, installDate: undefined, constructionUnit: undefined,
    status: '0', userId: undefined,
  }
  proxy.resetForm('pipeRef')
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '添加管网管线'
}

function handleUpdate(row) {
  reset()
  getPipe(row.id).then(response => {
    form.value = response.data
    open.value = true
    title.value = '修改管网管线'
  })
}

function submitForm() {
  proxy.$refs['pipeRef'].validate(valid => {
    if (valid) {
      if (form.value.id != undefined) {
        updatePipe(form.value).then(() => {
          proxy.$modal.msgSuccess('修改成功')
          open.value = false
          getList()
        })
      } else {
        addPipe(form.value).then(() => {
          proxy.$modal.msgSuccess('新增成功')
          open.value = false
          getList()
        })
      }
    }
  })
}

function cancel() {
  open.value = false
  reset()
}

function getUserList() {
  listUser({ pageNum: 1, pageSize: 1000 }).then(res => {
    userOptions.value = res.rows
  })
}

function computeStats(list) {
  stats.total = list.length
  stats.active = list.filter(i => String(i.status) === '0').length
  stats.inactive = list.filter(i => String(i.status) !== '0').length
}
function getList() {
  loading.value = true
  listPipe(queryParams.value).then(res => {
    pipeList.value = res.data.list
    total.value = res.data.total
    computeStats(res.data.list)
    loading.value = false
  })
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除管线"' + row.name + '"？').then(() => {
    return delPipe(row.id)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

function handleExport() {
  proxy.download('/water-basic/pipe/export', { ...queryParams.value }, `pipe_${new Date().getTime()}.xlsx`)
}

function handleImport() {
  upload.value.title = '管网管线数据极速导入'
  upload.value.open = true
  upload.value.progress = 0
  upload.value.totalRows = 0
}

function importTemplate() {
  proxy.download('/water-basic/pipe/importTemplate', {}, `pipe_template_${new Date().getTime()}.xlsx`)
}

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
    proxy.$modal.msgError('仅支持 xls, xlsx 格式的文件')
    return
  }

  upload.value.open = false
  upload.value.isUploading = true
  upload.value.progress = 10

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      upload.value.progress = 30
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array', cellDates: true })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      const jsonArr = XLSX.utils.sheet_to_json(worksheet)
      upload.value.totalRows = jsonArr.length
      upload.value.progress = 50

      if (jsonArr.length === 0) {
        throw new Error('上传的文件没有数据')
      }

      const parsedData = jsonArr.map(row => ({
        zoneCode: row['所属分区编码'] || row['所属分区'] || '',
        name: row['管线名称(必填)'] || row['管线名称'] || '',
        code: row['管线编码(必填)'] || row['管线编码'] || '',
        pipeType: row['管线类型(必填)'] || row['管线类型'] || '',
        material: row['管材'] || '',
        diameter: parseFloat(row['管径(mm)']) || null,
        length: parseFloat(row['长度(m)']) || null,
        startNode: row['起点节点'] || '',
        endNode: row['终点节点'] || '',
        burialDepth: parseFloat(row['埋深(m)']) || null,
        installDate: row['铺设日期(YYYY-MM-DD)'] || row['铺设日期'] || null,
        constructionUnit: row['施工单位'] || '',
      })).filter(item => item.name && item.code)

      upload.value.totalRows = parsedData.length
      upload.value.progress = 70

      const batchSize = 500
      const total = parsedData.length
      let imported = 0

      for (let i = 0; i < total; i += batchSize) {
        const chunk = parsedData.slice(i, i + batchSize)
        await importPipeBatch(chunk)
        imported += chunk.length
        upload.value.progress = 70 + Math.floor((imported / total) * 25)
      }

      upload.value.progress = 100
      setTimeout(() => {
        upload.value.isUploading = false
        proxy.$modal.notifySuccess(`成功导入 ${imported} 条记录`)
        getList()
      }, 300)

    } catch (err) {
      console.error(err)
      upload.value.isUploading = false
      proxy.$modal.msgError(err.message || '解析文件失败，请检查文件格式')
    }
  }
  reader.onerror = () => {
    upload.value.isUploading = false
    proxy.$modal.msgError('读取文件出错')
  }
  reader.readAsArrayBuffer(file)
}

onMounted(() => {
  getList()
  getUserList()
})
</script>

<style scoped>
.mr-1 { margin-right: 5px; vertical-align: middle; }

.full-height-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.full-height-row {
  flex: 1;
  margin: 0 !important;
  display: flex;
  min-height: 0;
}

.full-height-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
  min-height: 0;
}

.flex-table {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.stats-mini-row {
  flex-shrink: 0;
  margin: 0 0 10px 0 !important;
}
.mini-stat-card { background: #fff; border-radius: 8px; border: 1px solid #ebeef5; padding: 10px 14px; text-align: center; box-shadow: 0 1px 6px rgba(0,0,0,.03); }
.mini-num { font-size: 22px; font-weight: 700; line-height: 1.2; }
.mini-label { font-size: 11px; color: #909399; margin-top: 2px; }
.mini-total .mini-num { color: #303133; }
.mini-online .mini-num { color: #67c23a; }
.mini-offline .mini-num { color: #c0c4cc; }

.custom-pagination {
  margin-top: 10px;
  flex-shrink: 0;
}

:deep(.el-table) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.el-table__inner-wrapper) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.el-table__body-wrapper) {
  flex: 1;
  overflow-y: auto !important;
}

.modern-import-dialog :deep(.el-dialog__header) {
  padding: 24px 24px 0;
  text-align: center;
  font-weight: 600;
  font-size: 18px;
}

.import-modal-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px;
}

.upload-zone {
  border: 2px dashed #dcdfe6;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
  position: relative;
}

.upload-zone:hover {
  border-color: #409EFF;
  background-color: #f0f7ff;
}

.upload-icon {
  font-size: 48px;
  color: #a8abb2;
  margin-bottom: 16px;
  transition: color 0.3s;
}

.upload-zone:hover .upload-icon {
  color: #409EFF;
}

.upload-zone h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #303133;
}

.upload-zone p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.hidden-input { display: none; }

.template-download {
  text-align: center;
  font-size: 13px;
  color: #606266;
  background: #f4f4f5;
  padding: 12px;
  border-radius: 8px;
}

.progress-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease;
}

.progress-card {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.pulse-ring {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(64,158,255,0.1) 0%, rgba(64,158,255,0) 70%);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.loading-icon {
  font-size: 56px;
  color: #409EFF;
  margin-bottom: 20px;
}

.progress-title { font-size: 20px; font-weight: 600; color: #303133; margin: 0 0 10px; }
.progress-desc { font-size: 14px; color: #909399; margin: 0 0 30px; }
.modern-progress :deep(.el-progress-bar__outer) { background-color: #ebeef5; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}

/* ===== 卡片式表单对话框 ===== */
:deep(.equip-dialog .el-dialog__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #ecf5ff 100%);
  border-bottom: 1px solid #e4e7ed;
  padding: 16px 24px;
  margin: 0;
}
:deep(.equip-dialog .el-dialog__title) {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.3px;
}
:deep(.equip-dialog .el-dialog__body) {
  padding: 0;
  background: #f8fafc;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(90vh - 110px);
}
:deep(.equip-dialog .el-dialog__footer) {
  padding: 12px 24px;
  border-top: 1px solid #f0f2f5;
  background: #fff;
}

.dialog-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 24px;
}
.dialog-scroll::-webkit-scrollbar { width: 5px; }
.dialog-scroll::-webkit-scrollbar-thumb { background: #c0c4cc; border-radius: 3px; }
.dialog-scroll::-webkit-scrollbar-track { background: transparent; }

.form-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
  transition: box-shadow 0.2s;
}
.form-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,.06); }

.card-header {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f2f5;
  gap: 10px;
}
.card-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  flex-shrink: 0;
}
.card-dot.dot-purple { background: #8b5cf6; }
.card-dot.dot-green  { background: #10b981; }
.card-dot.dot-orange { background: #f59e0b; }
.card-dot.dot-gray   { background: #94a3b8; }

.card-icon { font-size: 16px; color: #64748b; }
.card-title { font-size: 14px; font-weight: 600; color: #334155; }
.card-body { padding: 18px 20px; }
</style>
