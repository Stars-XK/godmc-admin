<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="用户编号" prop="userNo">
        <el-input v-model="queryParams.userNo" placeholder="请输入用户编号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="用户名称" prop="userName">
        <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="queryParams.phone" placeholder="请输入手机号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="用户状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择用户状态" clearable>
          <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['water-basic:revenue:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['water-basic:revenue:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['water-basic:revenue:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="info" plain icon="Upload" @click="handleImport" v-hasPermi="['water-basic:revenue:import']">导入</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="用户编号" align="center" prop="userNo" width="120" />
      <el-table-column label="用户名称" align="center" prop="userName" min-width="150" />
      <el-table-column label="水卡分类" align="center" prop="cardCategory" width="100">
        <template #default="scope">
          <dict-tag :options="water_card_category" :value="scope.row.cardCategory"/>
        </template>
      </el-table-column>
      <el-table-column label="用户分类" align="center" prop="userCategory" min-width="150">
        <template #default="scope">
          <dict-tag :options="water_user_category" :value="scope.row.userCategory"/>
        </template>
      </el-table-column>
      <el-table-column label="水表编号" align="center" prop="meterNo" width="120" />
      <el-table-column label="手机号" align="center" prop="phone" width="120" />
      <el-table-column label="地址" align="center" prop="address" min-width="180" show-overflow-tooltip />
      <el-table-column label="欠费金额(元)" align="center" prop="arrearsAmount" width="110">
        <template #default="scope">
          <span :style="{ color: scope.row.arrearsAmount > 0 ? '#F56C6C' : '#67C23A', fontWeight: 'bold' }">
            {{ scope.row.arrearsAmount }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['water-basic:revenue:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['water-basic:revenue:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" v-model="open" width="700px" append-to-body>
      <el-form ref="userRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户编号" prop="userNo">
              <el-input v-model="form.userNo" placeholder="请输入用户编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户名称" prop="userName">
              <el-input v-model="form.userName" placeholder="请输入用户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="水表编号" prop="meterNo">
              <el-input v-model="form.meterNo" placeholder="请输入水表编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="水卡分类" prop="cardCategory">
              <el-select v-model="form.cardCategory" placeholder="请选择水卡分类" style="width: 100%;">
                <el-option v-for="dict in water_card_category" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户分类" prop="userCategory">
              <el-select v-model="form.userCategory" placeholder="请选择用户分类" style="width: 100%;">
                <el-option v-for="dict in water_user_category" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="表册编号" prop="bookNo">
              <el-input v-model="form.bookNo" placeholder="请输入表册编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="口径" prop="caliber">
              <el-input v-model="form.caliber" placeholder="请输入水表口径" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="欠费金额" prop="arrearsAmount">
              <el-input-number v-model="form.arrearsAmount" :precision="2" :step="1" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.value">{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="详细地址" prop="address">
              <el-input v-model="form.address" type="textarea" placeholder="请输入用户地址" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注信息" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
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

    <!-- 极速批量导入弹窗 -->
    <el-dialog :title="upload.title" v-model="upload.open" width="480px" class="modern-import-dialog" :show-close="false" append-to-body>
      <div class="import-modal-content">
        <div class="upload-zone" @dragover.prevent @drop.prevent="handleDrop" @click="triggerFileInput">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <h3>点击或拖拽 Excel 文件到此区域</h3>
          <p>仅支持 .xls, .xlsx 格式文件，单次建议不超过 20000 条数据</p>
          <input type="file" ref="fileInputRef" accept=".xls,.xlsx" class="hidden-input" @change="handleFileChange" />
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
        ></el-progress>
      </div>
    </div>
  </div>
</template>

<script setup name="RevenueUser">
import { ref, reactive, toRefs, onMounted, getCurrentInstance } from 'vue'
import { listRevenueUser, getRevenueUser, delRevenueUser, addRevenueUser, updateRevenueUser, importRevenueUserBatch } from '@/api/water-basic/revenue-user'
import * as XLSX from 'xlsx'

const { proxy } = getCurrentInstance()
const { sys_normal_disable, water_card_category, water_user_category } = proxy.useDict('sys_normal_disable', 'water_card_category', 'water_user_category')

const userList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")

const queryParams = ref({
  pageNum: 1, pageSize: 10, userNo: undefined, userName: undefined, phone: undefined, status: undefined, cardCategory: undefined, userCategory: undefined
})

const form = ref({})
const rules = {
  userNo: [{ required: true, message: "用户编号不能为空", trigger: "blur" }],
  userName: [{ required: true, message: "用户名称不能为空", trigger: "blur" }]
}

// 导入相关
const upload = ref({ open: false, title: "", isUploading: false, progress: 0, totalRows: 0 })
const fileInputRef = ref(null)
const customColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
]

function getList() {
  loading.value = true
  listRevenueUser(queryParams.value).then(res => {
    userList.value = res.data.list
    total.value = res.data.total
    loading.value = false
  })
}

function cancel() {
  open.value = false
  reset()
}

function reset() {
  form.value = {
    id: undefined, userNo: undefined, userName: undefined, phone: undefined, address: undefined,
    meterNo: undefined, bookNo: undefined, chargeType: undefined, caliber: undefined,
    cardCategory: "A", userCategory: "A01", status: "0", arrearsAmount: 0, remark: undefined
  }
  proxy.resetForm("userRef")
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  reset()
  open.value = true
  title.value = "添加营收用户"
}

function handleUpdate(row) {
  reset()
  const id = row.id || ids.value
  getRevenueUser(id).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改营收用户"
  })
}

function submitForm() {
  proxy.$refs["userRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateRevenueUser(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addRevenueUser(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

function handleDelete(row) {
  const userIds = row.id || ids.value
  proxy.$modal.confirm('是否确认删除所选的营收用户信息？').then(function() {
    return delRevenueUser(userIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

// ================== 极速导入逻辑 ==================
function handleImport() {
  upload.value.title = "营收基础信息极速导入"
  upload.value.open = true
  upload.value.progress = 0
  upload.value.totalRows = 0
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
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonArr = XLSX.utils.sheet_to_json(worksheet)
      
      upload.value.totalRows = jsonArr.length
      upload.value.progress = 50
      if (jsonArr.length === 0) throw new Error('上传的文件没有数据')

      const parsedData = jsonArr.map(row => {
        return {
          userNo: row['用户编号'] || '',
          userName: row['用户名称'] || '',
          phone: row['手机号'] || '',
          address: row['地址'] || '',
          meterNo: row['水表编号'] || '',
          bookNo: row['表册编号'] || '',
          chargeType: row['收费类型'] || '',
          caliber: row['口径'] || '',
          cardCategory: row['水卡分类'] || 'A',
          userCategory: row['用户分类'] || 'A01',
          arrearsAmount: parseFloat(row['欠费金额']) || 0
        }
      }).filter(item => item.userNo && item.userName)

      upload.value.progress = 60
      
      // 分批推送给后端，每次发500条，避免前端请求体过大
      const batchSize = 500;
      let totalSuccess = 0;
      
      for(let i = 0; i < parsedData.length; i += batchSize) {
        const chunk = parsedData.slice(i, i + batchSize)
        await importRevenueUserBatch(chunk)
        totalSuccess += chunk.length
        
        // 动态更新进度 (60% ~ 100%)
        upload.value.progress = 60 + Math.floor((totalSuccess / parsedData.length) * 40)
      }
      
      upload.value.progress = 100
      setTimeout(() => {
        upload.value.isUploading = false
        proxy.$modal.notifySuccess(`成功导入 ${totalSuccess} 条营收用户记录`)
        getList()
      }, 500)
      
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
})
</script>

<style scoped>
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