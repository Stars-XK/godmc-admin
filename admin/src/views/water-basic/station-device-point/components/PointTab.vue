<template>
  <div class="point-tab">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
          <el-form-item label="测点名称" prop="name">
            <el-input v-model="queryParams.name" placeholder="请输入测点名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="测点编码" prop="code">
            <el-input v-model="queryParams.code" placeholder="请输入测点编码" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="测点类型" prop="type">
            <el-select v-model="queryParams.type" placeholder="请选择类型" clearable>
              <el-option v-for="dict in water_point_type" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['water-basic:point:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Upload" @click="handleImport" v-hasPermi="['water-basic:point:import']">导入</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['water-basic:point:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="pointList">
          <el-table-column type="index" width="50" align="center" />
          <el-table-column label="测点名称" align="left" prop="name" min-width="180">
            <template #default="scope">
              <el-icon class="mr-1" color="#409EFC"><Odometer /></el-icon>
              <span>{{ scope.row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="测点编码" align="center" prop="code" width="150" />
          <el-table-column label="所属设备" align="center" prop="deviceCode" width="120" />
          <el-table-column label="测点类型" align="center" prop="type" width="120">
            <template #default="scope">
              <dict-tag :options="water_point_type" :value="String(scope.row.type)" />
            </template>
          </el-table-column>
          <el-table-column label="量程(Min~Max)" align="center" width="150">
            <template #default="scope">
              {{ scope.row.rangeMin !== null ? scope.row.rangeMin : '-' }} ~ {{ scope.row.rangeMax !== null ? scope.row.rangeMax : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="报警(Min~Max)" align="center" width="150">
            <template #default="scope">
              <span style="color: #F56C6C">{{ scope.row.alarmMin !== null ? scope.row.alarmMin : '-' }} ~ {{ scope.row.alarmMax !== null ? scope.row.alarmMax : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" prop="unit" width="80" />
          <el-table-column label="数据类型" align="center" prop="dataType" width="100" />
          <el-table-column label="读写" align="center" prop="rwAttr" width="80" />
          <el-table-column label="状态" align="center" prop="status" width="100">
            <template #default="scope">
              <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['water-basic:point:edit']">修改</el-button>
              <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['water-basic:point:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </el-col>
    </el-row>

    <!-- 添加或修改测点对话框 -->
    <el-dialog :title="title" v-model="open" width="700px" append-to-body>
      <el-form ref="pointRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="测点名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入测点名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="测点编码" prop="code">
              <el-input v-model="form.code" placeholder="请输入测点编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属设备" prop="deviceCode">
              <el-input v-model="form.deviceCode" placeholder="请输入设备编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="测点类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%;">
                <el-option v-for="dict in water_point_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="量程上限" prop="rangeMax">
              <el-input-number v-model="form.rangeMax" :precision="2" :step="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="量程下限" prop="rangeMin">
              <el-input-number v-model="form.rangeMin" :precision="2" :step="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报警上限" prop="alarmMax">
              <el-input-number v-model="form.alarmMax" :precision="2" :step="0.1" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报警下限" prop="alarmMin">
              <el-input-number v-model="form.alarmMin" :precision="2" :step="0.1" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计量单位" prop="unit">
              <el-input v-model="form.unit" placeholder="请输入单位 (如 m³/h)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据类型" prop="dataType">
              <el-select v-model="form.dataType" placeholder="请选择" style="width: 100%;">
                <el-option label="浮点型 (float)" value="float" />
                <el-option label="整型 (int)" value="int" />
                <el-option label="布尔型 (bool)" value="bool" />
                <el-option label="字符串 (string)" value="string" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="读写属性" prop="rwAttr">
              <el-select v-model="form.rwAttr" placeholder="请选择" style="width: 100%;">
                <el-option label="只读 (R)" value="R" />
                <el-option label="读写 (R/W)" value="R/W" />
                <el-option label="只写 (W)" value="W" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
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
import { listPoint, delPoint, getPoint, addPoint, updatePoint } from '@/api/water-basic/equipment'
import { listUser } from "@/api/system/user"
import { getToken } from "@/utils/auth"

const { proxy } = getCurrentInstance()
const { water_point_type, sys_normal_disable } = proxy.useDict('water_point_type', 'sys_normal_disable')

const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const uploadRef = ref(null)
const userOptions = ref([])

const pointList = ref([])

const form = ref({})
const queryParams = ref({ pageNum: 1, pageSize: 10, name: undefined, code: undefined, type: undefined })
const upload = ref({
  open: false, title: "", isUploading: false, progress: 0,
  headers: { Authorization: "Bearer " + getToken() },
  url: import.meta.env.VITE_APP_BASE_API + "/water-basic/point/importData"
})
const rules = {
  name: [{ required: true, message: "测点名称不能为空", trigger: "blur" }],
  code: [{ required: true, message: "测点编码不能为空", trigger: "blur" }],
  deviceCode: [{ required: true, message: "所属设备不能为空", trigger: "blur" }],
  type: [{ required: true, message: "请选择测点类型", trigger: "change" }]
}

const open = ref(false)
const title = ref("")

function reset() {
  form.value = {
    id: undefined, name: undefined, code: undefined, deviceCode: undefined, type: "1",
    rangeMax: undefined, rangeMin: undefined, alarmMax: undefined, alarmMin: undefined,
    unit: undefined, dataType: "float", rwAttr: "R", status: "0"
  }
  proxy.resetForm("pointRef")
}

function handleAdd() {
  reset()
  open.value = true
  title.value = "添加测点"
}

function handleUpdate(row) {
  reset()
  getPoint(row.id).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改测点"
  })
}

function submitForm() {
  proxy.$refs["pointRef"].validate(valid => {
    if (valid) {
      if (form.value.id != undefined) {
        updatePoint(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addPoint(form.value).then(() => {
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
  listPoint(queryParams.value).then(res => {
    pointList.value = res.data.list
    total.value = res.data.total
    loading.value = false
  })
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm("queryRef"); handleQuery() }

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除测点"' + row.name + '"？').then(() => {
    return delPoint(row.id)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

function handleExport() {
  proxy.download('/water-basic/point/export', { ...queryParams.value }, `point_${new Date().getTime()}.xlsx`)
}

function handleImport() {
  upload.value.title = "测点导入"
  upload.value.open = true
  upload.value.progress = 0
}

function importTemplate() {
  proxy.download("/water-basic/point/importTemplate", {}, `point_template_${new Date().getTime()}.xlsx`)
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
