<template>
  <div class="station-tab full-height-tab">
    <el-row :gutter="20" class="full-height-row">
      <el-col :span="24" class="full-height-col">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
          <el-form-item label="站点名称" prop="name">
            <el-input v-model="queryParams.name" placeholder="请输入站点名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="站点编码" prop="code">
            <el-input v-model="queryParams.code" placeholder="请输入站点编码" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="站点类型" prop="type">
            <el-select v-model="queryParams.type" placeholder="请选择类型" clearable>
              <el-option v-for="dict in water_station_type" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['water-basic:station:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Upload" @click="handleImport" v-hasPermi="['water-basic:station:import']">导入</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['water-basic:station:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <!-- 状态统计卡片 -->
        <el-row :gutter="12" class="stats-mini-row">
          <el-col :span="4">
            <div class="mini-stat-card mini-total">
              <div class="mini-num">{{ stats.total }}</div>
              <div class="mini-label">站点总数</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="mini-stat-card mini-online">
              <div class="mini-num">{{ stats.online }}</div>
              <div class="mini-label">在线</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="mini-stat-card mini-abnormal">
              <div class="mini-num">{{ stats.abnormal }}</div>
              <div class="mini-label">异常</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="mini-stat-card mini-alarm">
              <div class="mini-num">{{ stats.alarm }}</div>
              <div class="mini-label">报警</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="mini-stat-card mini-offline">
              <div class="mini-num">{{ stats.offline }}</div>
              <div class="mini-label">离线</div>
            </div>
          </el-col>
        </el-row>

        <el-table v-loading="loading" :data="stationList" height="100%" class="flex-table">
          <el-table-column type="index" width="50" align="center" />
          <el-table-column label="站点名称" align="left" prop="name" min-width="180">
            <template #default="scope">
              <el-icon class="mr-1" color="#409EFC"><OfficeBuilding /></el-icon>
              <span>{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="站点编码" align="center" prop="code" min-width="220" />
          <el-table-column label="所属分区" align="center" prop="zoneCode" min-width="160" />
          <el-table-column label="站点类型" align="center" prop="type" width="120">
            <template #default="scope">
              <dict-tag :options="water_station_type" :value="String(scope.row.type)" />
            </template>
          </el-table-column>
          <el-table-column label="经纬度" align="center" min-width="250">
            <template #default="{ row }">
              <span v-if="row.longitude && row.latitude">{{ row.longitude }}, {{ row.latitude }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" prop="status" width="100">
            <template #default="scope">
              <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
            </template>
          </el-table-column>
      <el-table-column label="物联状态" align="center" prop="iotStatus" width="100">
        <template #default="scope">
          <dict-tag :options="iot_device_status" :value="scope.row.iotStatus" />
        </template>
      </el-table-column>
          <el-table-column label="操作" align="center" width="240" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button link type="primary" icon="DataLine" @click="handleDataView(scope.row)">实时数据</el-button>
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['water-basic:station:edit']">修改</el-button>
              <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['water-basic:station:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
          
          <pagination class="custom-pagination" v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-col>
      </el-row>

    <!-- 实时数据抽屉 -->
    <el-drawer v-model="drawerOpen" :title="drawerTitle" size="50%">
      <DataViewer v-if="drawerOpen" viewType="station" :code="drawerCode" :name="drawerName" />
    </el-drawer>

    <!-- 添加或修改站点对话框 -->
    <el-dialog :title="title" v-model="open" width="780px" top="5vh" append-to-body class="equip-dialog" destroy-on-close>
      <div class="dialog-scroll">
      <el-form ref="stationRef" :model="form" :rules="rules" label-width="100px">
        <div class="form-card">
          <div class="card-header">
            <span class="card-dot"></span>
            <el-icon class="card-icon"><Document /></el-icon>
            <span class="card-title">基本信息</span>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="站点名称" prop="name">
                  <el-input v-model="form.name" placeholder="请输入站点名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="站点编码" prop="code">
                  <el-input v-model="form.code" placeholder="请输入站点编码" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="所属分区" prop="zoneCode">
                  <el-input v-model="form.zoneCode" placeholder="请输入分区编码" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="站点类型" prop="type">
                  <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%;">
                    <el-option v-for="dict in water_station_type" :key="dict.value" :label="dict.label" :value="dict.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <div class="form-card">
          <div class="card-header">
            <span class="card-dot dot-purple"></span>
            <el-icon class="card-icon"><Location /></el-icon>
            <span class="card-title">位置信息</span>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="经度(X)" prop="longitude">
                  <el-input v-model="form.longitude" placeholder="请输入经度" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="纬度(Y)" prop="latitude">
                  <el-input v-model="form.latitude" placeholder="请输入纬度" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="详细地址" prop="address">
                  <el-input v-model="form.address" placeholder="请输入详细地址" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <div class="form-card">
          <div class="card-header">
            <span class="card-dot dot-green"></span>
            <el-icon class="card-icon"><Setting /></el-icon>
            <span class="card-title">运营信息</span>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="设计能力" prop="designCapacity">
                  <el-input-number v-model="form.designCapacity" :min="0" :precision="2" :step="100" style="width: 100%;" placeholder="m³/d" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="投运日期" prop="commissioningDate">
                  <el-date-picker clearable v-model="form.commissioningDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择投运日期" style="width: 100%;" />
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
              <el-col :span="12">
                <el-form-item label="建设单位" prop="constructionUnit">
                  <el-input v-model="form.constructionUnit" placeholder="请输入建设单位" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <div class="form-card">
          <div class="card-header">
            <span class="card-dot dot-orange"></span>
            <el-icon class="card-icon"><UserFilled /></el-icon>
            <span class="card-title">其他设置</span>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="状态">
                  <el-radio-group v-model="form.status">
                    <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{dict.label}}</el-radio>
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
import { listStation, delStation, getStation, addStation, updateStation, importStationBatch } from '@/api/water-basic/equipment'
import { listUser } from "@/api/system/user"
import * as XLSX from 'xlsx'
import { getToken } from "@/utils/auth"
import DataViewer from '@/components/DataViewer/index.vue'
import { Document, Location, Setting, UserFilled } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()
const { water_station_type, sys_normal_disable , iot_device_status } = proxy.useDict('water_station_type', 'sys_normal_disable', 'iot_device_status')

const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const uploadRef = ref(null)
const userOptions = ref([])
const stats = reactive({ total: 0, online: 0, abnormal: 0, alarm: 0, offline: 0 })

const drawerOpen = ref(false)
const drawerTitle = ref('')
const drawerCode = ref('')
const drawerName = ref('')

function handleDataView(row) {
  drawerCode.value = row.code
  drawerName.value = row.name
  drawerTitle.value = '站点数据 - ' + row.name
  drawerOpen.value = true
}

/**
 * @typedef {Object} StationRecord
 * @property {number} [id]
 * @property {string} [name]
 * @property {string} [code]
 * @property {string} [zoneCode]
 * @property {string|number} [type]
 * @property {string} [longitude]
 * @property {string} [latitude]
 * @property {number} [designCapacity]
 * @property {string} [managerName]
 * @property {string} [managerPhone]
 * @property {string} [status]
 */

/** @type {import('vue').Ref<StationRecord[]>} */
const stationList = ref([])

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
  name: [{ required: true, message: "站点名称不能为空", trigger: "blur" }],
  code: [{ required: true, message: "站点编码不能为空", trigger: "blur" }],
  type: [{ required: true, message: "请选择站点类型", trigger: "change" }]
}

const open = ref(false)
const title = ref("")

function reset() {
  form.value = {
    id: undefined, name: undefined, code: undefined, zoneCode: undefined, type: "WATER_PLANT",
    longitude: undefined, latitude: undefined, designCapacity: undefined, commissioningDate: undefined,
    managerName: undefined, managerPhone: undefined, constructionUnit: undefined, address: undefined,
    status: "0", userId: undefined
  }
  proxy.resetForm("stationRef")
}

function handleAdd() {
  reset()
  open.value = true
  title.value = "添加站点"
}

function handleUpdate(row) {
  reset()
  getStation(row.id).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改站点"
  })
}

function submitForm() {
  proxy.$refs["stationRef"].validate(valid => {
    if (valid) {
      if (form.value.id != undefined) {
        updateStation(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addStation(form.value).then(() => {
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

function computeStats(list, totalCount) {
  stats.total = totalCount
  stats.online = list.filter(i => String(i.iotStatus) === '0').length
  stats.abnormal = list.filter(i => String(i.iotStatus) === '1').length
  stats.alarm = list.filter(i => String(i.iotStatus) === '3').length
  stats.offline = list.filter(i => !['0','1','3'].includes(String(i.iotStatus))).length
}

function getList() {
  loading.value = true
  listStation(queryParams.value).then(res => {
    stationList.value = res.data.list
    total.value = res.data.total
    computeStats(res.data.list, res.data.total)
    loading.value = false
  })
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除站点"' + row.name + '"？').then(() => {
    return delStation(row.id)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

function handleExport() {
  proxy.download('/water-basic/station/export', { ...queryParams.value }, `station_${new Date().getTime()}.xlsx`)
}

function handleImport() {
  upload.value.title = "站点数据极速导入"
  upload.value.open = true
  upload.value.progress = 0
  upload.value.totalRows = 0
}

function importTemplate() {
  proxy.download("/water-basic/station/importTemplate", {}, `station_template_${new Date().getTime()}.xlsx`)
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
  
  // Close dialog and show overlay
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
      
      // Parse as array of objects to map via headers
      const jsonArr = XLSX.utils.sheet_to_json(worksheet)
      upload.value.totalRows = jsonArr.length
      upload.value.progress = 50
      
      if (jsonArr.length === 0) {
        throw new Error('上传的文件没有数据')
      }

      // Map to backend keys based on Chinese headers or index
      // Backend expects: zoneCode, name, code, type, longitude, latitude, designCapacity, constructionUnit, commissioningDate, managerName, managerPhone, address
      const parsedData = jsonArr.map(row => {
        return {
          zoneCode: row['所属分区编码'] || row['所属分区'] || '',
          name: row['站点名称(必填)'] || row['站点名称'] || '',
          code: row['站点编码(必填)'] || row['站点编码'] || '',
          type: row['站点类型(必填)'] || row['站点类型'] || '',
          longitude: row['经度(X)'] || '',
          latitude: row['纬度(Y)'] || '',
          designCapacity: parseFloat(row['设计能力']) || null,
          constructionUnit: row['建设单位'] || '',
          commissioningDate: row['投运日期(YYYY-MM-DD)'] || row['投运日期'] || null,
          managerName: row['负责人'] || '',
          managerPhone: row['联系电话'] || row['电话'] || '',
          address: row['详细地址'] || row['地址'] || ''
        }
      }).filter(item => item.name && item.code)

      upload.value.totalRows = parsedData.length
      upload.value.progress = 70

      const batchSize = 500
      const total = parsedData.length
      let imported = 0

      for (let i = 0; i < total; i += batchSize) {
        const chunk = parsedData.slice(i, i + batchSize)
        await importStationBatch(chunk)
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
.mini-stat-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  padding: 10px 14px;
  text-align: center;
  box-shadow: 0 1px 6px rgba(0,0,0,.03);
}
.mini-num { font-size: 22px; font-weight: 700; line-height: 1.2; }
.mini-label { font-size: 11px; color: #909399; margin-top: 2px; }
.mini-total .mini-num { color: #303133; }
.mini-online .mini-num { color: #67c23a; }
.mini-abnormal .mini-num { color: #e6a23c; }
.mini-alarm .mini-num { color: #f56c6c; }
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
