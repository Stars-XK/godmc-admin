<template>
  <div class="station-tab">
    <el-row :gutter="20">
      <el-col :span="24">
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

        <el-table v-loading="loading" :data="stationList">
          <el-table-column type="index" width="50" align="center" />
          <el-table-column label="站点名称" align="left" prop="name" min-width="180">
            <template #default="scope">
              <el-icon class="mr-1" color="#409EFC"><OfficeBuilding /></el-icon>
              <span>{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="站点编码" align="center" prop="code" width="150" />
          <el-table-column label="所属分区" align="center" prop="zoneCode" width="120" />
          <el-table-column label="站点类型" align="center" prop="type" width="120">
            <template #default="scope">
              <dict-tag :options="water_station_type" :value="String(scope.row.type)" />
            </template>
          </el-table-column>
          <el-table-column label="经纬度" align="center" width="150">
            <template #default="{ row }">
              <span v-if="row.longitude && row.latitude">{{ row.longitude }}, {{ row.latitude }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="设计能力" align="center" prop="designCapacity" width="100" />
          <el-table-column label="负责人" align="center" prop="managerName" width="100" />
          <el-table-column label="联系电话" align="center" prop="managerPhone" width="120" />
          <el-table-column label="状态" align="center" prop="status" width="100">
            <template #default="scope">
              <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['water-basic:station:edit']">修改</el-button>
              <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['water-basic:station:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </el-col>
    </el-row>

    <!-- 添加或修改站点对话框 -->
    <el-dialog :title="title" v-model="open" width="700px" append-to-body>
      <el-form ref="stationRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
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
          <el-col :span="12">
            <el-form-item label="设计能力" prop="designCapacity">
              <el-input-number v-model="form.designCapacity" :min="0" :precision="2" :step="100" style="width: 100%;" placeholder="m³/d" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="投运日期" prop="commissioningDate">
              <el-date-picker clearable v-model="form.commissioningDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择投运日期" style="width: 100%;"></el-date-picker>
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
            <el-form-item label="建设单位" prop="constructionUnit">
              <el-input v-model="form.constructionUnit" placeholder="请输入建设单位" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="详细地址" prop="address">
              <el-input v-model="form.address" placeholder="请输入详细地址" />
            </el-form-item>
          </el-col>
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
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导入弹窗 -->
    <el-dialog :title="upload.title" v-model="upload.open" width="400px" append-to-body>
      <el-upload
        ref="uploadRef"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="upload.headers"
        :action="upload.url"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :on-error="handleFileError"
        :auto-upload="false"
        drag
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip text-center">
            <span>仅允许导入xls、xlsx格式文件。</span>
            <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importTemplate">下载模板</el-link>
          </div>
          <!-- 进度条 -->
          <div v-if="upload.isUploading" style="margin-top: 15px;">
            <el-progress :percentage="upload.progress" :format="formatProgress" :status="upload.progress === 100 ? 'success' : ''"></el-progress>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFileForm" :loading="upload.isUploading">确 定</el-button>
          <el-button @click="upload.open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { listStation, delStation, getStation, addStation, updateStation } from '@/api/water-basic/equipment'
import { listUser } from "@/api/system/user"
import { getToken } from "@/utils/auth"

const { proxy } = getCurrentInstance()
const { water_station_type, sys_normal_disable } = proxy.useDict('water_station_type', 'sys_normal_disable')

const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const uploadRef = ref(null)
const userOptions = ref([])

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
const queryParams = ref({ pageNum: 1, pageSize: 10, name: undefined, code: undefined, type: undefined })
const upload = ref({
  open: false, title: "", isUploading: false, progress: 0,
  headers: { Authorization: "Bearer " + getToken() },
  url: import.meta.env.VITE_APP_BASE_API + "/water-basic/station/importData"
})
const rules = {
  name: [{ required: true, message: "站点名称不能为空", trigger: "blur" }],
  code: [{ required: true, message: "站点编码不能为空", trigger: "blur" }],
  type: [{ required: true, message: "请选择站点类型", trigger: "change" }]
}

const open = ref(false)
const title = ref("")

function reset() {
  form.value = {
    id: undefined, name: undefined, code: undefined, zoneCode: undefined, type: "1",
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
  loading.value = true
  listStation(queryParams.value).then(res => {
    stationList.value = res.data.list
    total.value = res.data.total
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
  upload.value.title = "站点导入"
  upload.value.open = true
  upload.value.progress = 0
}

function importTemplate() {
  proxy.download("/water-basic/station/importTemplate", {}, `station_template_${new Date().getTime()}.xlsx`)
}

function handleFileUploadProgress(event) {
  upload.value.isUploading = true
  upload.value.progress = Math.floor(event.percent)
}

function formatProgress(percentage) {
  return percentage === 100 ? '处理中...' : `${percentage}%`
}

function handleFileSuccess(response) {
  upload.value.open = false
  upload.value.isUploading = false
  upload.value.progress = 0
  uploadRef.value.clearFiles()
  proxy.$modal.alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true })
  getList()
}

function handleFileError() {
  upload.value.isUploading = false
  upload.value.progress = 0
  proxy.$modal.msgError("上传失败")
}

function submitFileForm() {
  uploadRef.value.submit()
}

onMounted(() => { 
  getList()
  getUserList()
})
</script>

<style scoped>
.mr-1 { margin-right: 5px; vertical-align: middle; }
</style>
