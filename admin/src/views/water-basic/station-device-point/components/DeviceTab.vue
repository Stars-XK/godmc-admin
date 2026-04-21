<template>
  <div class="device-tab full-height-tab">
    <el-row :gutter="20" class="full-height-row">
      <el-col :span="24" class="full-height-col">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
          <el-form-item label="设备名称" prop="name">
            <el-input v-model="queryParams.name" placeholder="请输入设备名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="设备编码" prop="code">
            <el-input v-model="queryParams.code" placeholder="请输入设备编码" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="设备类型" prop="type">
            <el-select v-model="queryParams.type" placeholder="请选择类型" clearable>
              <el-option v-for="dict in water_device_type" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['water-basic:device:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Upload" @click="handleImport" v-hasPermi="['water-basic:device:import']">导入</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['water-basic:device:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="deviceList" height="100%" class="flex-table">
          <el-table-column type="index" width="50" align="center" />
          <el-table-column label="设备名称" align="left" prop="name" min-width="180">
            <template #default="scope">
              <el-icon class="mr-1" color="#409EFC"><Cpu /></el-icon>
              <span>{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="设备编码" align="center" prop="code" width="150" />
          <el-table-column label="所属站点" align="center" prop="stationCode" width="120" />
          <el-table-column label="设备类型" align="center" prop="type" width="120">
            <template #default="scope">
              <dict-tag :options="water_device_type" :value="String(scope.row.type)" />
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip />
          <el-table-column label="厂家" align="center" prop="manufacturer" width="150" show-overflow-tooltip />
          <el-table-column label="额定功率" align="center" prop="power" width="100" />
          <el-table-column label="安装日期" align="center" prop="installDate" width="110">
            <template #default="scope">
              <span>{{ parseTime(scope.row.installDate, '{y}-{m}-{d}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="寿命" align="center" prop="lifespan" width="80" />
          <el-table-column label="负责人" align="center" prop="managerName" width="100" />
          <el-table-column label="联系电话" align="center" prop="managerPhone" width="120" />
          <el-table-column label="状态" align="center" prop="status" width="100">
            <template #default="scope">
              <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['water-basic:device:edit']">修改</el-button>
              <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['water-basic:device:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </el-col>
    </el-row>

    <!-- 添加或修改设备对话框 -->
    <el-dialog :title="title" v-model="open" width="700px" append-to-body>
      <el-form ref="deviceRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备编码" prop="code">
              <el-input v-model="form.code" placeholder="请输入设备编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属站点" prop="stationCode">
              <el-input v-model="form.stationCode" placeholder="请输入站点编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%;">
                <el-option v-for="dict in water_device_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号" prop="model">
              <el-input v-model="form.model" placeholder="请输入型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="厂家" prop="manufacturer">
              <el-input v-model="form.manufacturer" placeholder="请输入厂家" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="安装日期" prop="installDate">
              <el-date-picker clearable v-model="form.installDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择安装日期" style="width: 100%;"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设计寿命" prop="lifespan">
              <el-input-number v-model="form.lifespan" :min="0" :max="100" style="width: 100%;" placeholder="年" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="额定功率" prop="power">
              <el-input v-model="form.power" placeholder="请输入功率(kW)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联系统用户" prop="userId">
              <el-select v-model="form.userId" filterable placeholder="选择关联用户" style="width: 100%;" clearable>
                <el-option v-for="user in userOptions" :key="user.userId" :label="user.userName + (user.nickName ? ' (' + user.nickName + ')' : '')" :value="user.userId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="managerName">
              <el-input v-model="form.managerName" placeholder="请输入负责人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="managerPhone">
              <el-input v-model="form.managerPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 现代化极简导入弹窗 -->
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

    <!-- 酷炫进度覆盖层 -->
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
        ></el-progress>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { listDevice, delDevice, getDevice, addDevice, updateDevice, importDeviceBatch } from '@/api/water-basic/equipment'
import { listUser } from "@/api/system/user"
import * as XLSX from 'xlsx'
import { getToken } from "@/utils/auth"

const { proxy } = getCurrentInstance()
const { water_device_type, sys_normal_disable } = proxy.useDict('water_device_type', 'sys_normal_disable')

const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const uploadRef = ref(null)
const userOptions = ref([])

/**
 * @typedef {Object} DeviceRecord
 * @property {number} [id]
 * @property {string} [name]
 * @property {string} [code]
 * @property {string} [stationCode]
 * @property {string|number} [type]
 * @property {string} [model]
 * @property {string} [manufacturer]
 * @property {string} [installDate]
 * @property {number} [lifespan]
 * @property {string|number} [power]
 * @property {string} [managerName]
 * @property {string} [managerPhone]
 * @property {string} [status]
 */

/** @type {import('vue').Ref<DeviceRecord[]>} */
const deviceList = ref([])

const form = ref({})
const queryParams = ref({ pageNum: 1, pageSize: 20, name: undefined, code: undefined, type: undefined })
const upload = ref({
  open: false, title: "", isUploading: false, progress: 0, totalRows: 0
})
const fileInputRef = ref(null)
const customColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 },
]
const rules = {
  name: [{ required: true, message: "设备名称不能为空", trigger: "blur" }],
  code: [{ required: true, message: "设备编码不能为空", trigger: "blur" }],
  stationCode: [{ required: true, message: "所属站点不能为空", trigger: "blur" }],
  type: [{ required: true, message: "请选择设备类型", trigger: "change" }]
}

const open = ref(false)
const title = ref("")

function reset() {
  form.value = {
    id: undefined, name: undefined, code: undefined, stationCode: undefined, type: "PUMP",
    model: undefined, manufacturer: undefined, installDate: undefined, lifespan: undefined, power: undefined,
    managerName: undefined, managerPhone: undefined, status: "0", userId: undefined
  }
  proxy.resetForm("deviceRef")
}

function handleAdd() {
  reset()
  open.value = true
  title.value = "添加设备"
}

function handleUpdate(row) {
  reset()
  getDevice(row.id).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改设备"
  })
}

function submitForm() {
  proxy.$refs["deviceRef"].validate(valid => {
    if (valid) {
      if (form.value.id != undefined) {
        updateDevice(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addDevice(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
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

function getList() {
  loading.value = true
  listDevice(queryParams.value).then(res => {
    deviceList.value = res.data.list
    total.value = res.data.total
    loading.value = false
  })
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除设备"' + row.name + '"？').then(() => {
    return delDevice(row.id)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

function handleExport() {
  proxy.download('/water-basic/device/export', { ...queryParams.value }, `device_${new Date().getTime()}.xlsx`)
}

function handleImport() {
  upload.value.title = "设备数据极速导入"
  upload.value.open = true
  upload.value.progress = 0
  upload.value.totalRows = 0
}

function importTemplate() {
  proxy.download("/water-basic/device/importTemplate", {}, `device_template_${new Date().getTime()}.xlsx`)
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
    proxy.$modal.msgError("仅支持 xls, xlsx 格式的文件")
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
      
      if (jsonArr.length === 0) throw new Error('上传的文件没有数据')

      const parsedData = jsonArr.map(row => {
        return {
          stationCode: row['所属站点编码(必填)'] || row['所属站点编码'] || '',
          name: row['设备名称(必填)'] || row['设备名称'] || '',
          code: row['设备编码(必填)'] || row['设备编码'] || '',
          type: row['设备类型(填写字典值如 PUMP)'] || row['设备类型'] || 'PUMP',
          model: row['型号'] || '',
          manufacturer: row['厂家'] || '',
          installDate: row['安装日期(YYYY-MM-DD)'] || row['安装日期'] || null,
          lifespan: parseInt(row['设计寿命(年)']) || null,
          power: row['额定功率(kW)'] || '',
          managerName: row['负责人'] || '',
          managerPhone: row['电话'] || row['联系电话'] || ''
        }
      }).filter(item => item.name && item.code)

      upload.value.totalRows = parsedData.length
      upload.value.progress = 70

      const batchSize = 500
      const total = parsedData.length
      let imported = 0

      for (let i = 0; i < total; i += batchSize) {
        const chunk = parsedData.slice(i, i + batchSize)
        await importDeviceBatch(chunk)
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
      proxy.$modal.msgError(err.message || "解析文件失败，请检查文件格式")
    }
  }
  reader.onerror = () => {
    upload.value.isUploading = false
    proxy.$modal.msgError("读取文件出错")
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
}

.full-height-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
}

.flex-table {
  flex: 1;
}

:deep(.el-table) {
  height: 100% !important;
}

:deep(.el-table__inner-wrapper) {
  height: 100% !important;
}

/* 现代化导入弹窗 */
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

.hidden-input {
  display: none;
}

.template-download {
  text-align: center;
  font-size: 13px;
  color: #606266;
  background: #f4f4f5;
  padding: 12px;
  border-radius: 8px;
}

/* 沉浸式进度覆盖层 */
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

.progress-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 10px;
}

.progress-desc {
  font-size: 14px;
  color: #909399;
  margin: 0 0 30px;
}

.modern-progress :deep(.el-progress-bar__outer) {
  background-color: #ebeef5;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}
</style>
