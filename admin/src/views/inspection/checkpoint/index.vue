<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="90px">
      <el-form-item label="检查点名称" prop="checkpointName">
        <el-input v-model="queryParams.checkpointName" placeholder="请输入名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="检查点类型" prop="checkpointType">
        <el-select v-model="queryParams.checkpointType" placeholder="请选择类型" clearable>
          <el-option label="目视检查" value="visual" />
          <el-option label="抄表" value="meter_reading" />
          <el-option label="设备检查" value="equipment" />
          <el-option label="环境检查" value="env" />
          <el-option label="安全检查" value="safety" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="checkpointList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="检查点名称" align="center" prop="checkpointName" show-overflow-tooltip />
      <el-table-column label="编码" align="center" prop="checkpointCode" />
      <el-table-column label="类型" align="center" prop="checkpointType">
        <template #default="scope">
          <el-tag>{{ checkpointTypeMap[scope.row.checkpointType] || scope.row.checkpointType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="关联实体" align="center" prop="refName">
        <template #default="scope">
          <span v-if="scope.row.refName">{{ refTypeMap[scope.row.refType] }}: {{ scope.row.refName }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="坐标" align="center">
        <template #default="scope">
          <span v-if="scope.row.lng && scope.row.lat">{{ scope.row.lng }}, {{ scope.row.lat }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="检查项数" align="center" prop="checkItemCount" />
      <el-table-column label="排序" align="center" prop="sortOrder" width="60" />
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleViewItems(scope.row)">检查项</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/修改对话框 -->
    <el-dialog :title="title" v-model="open" width="650px" append-to-body>
      <el-form ref="checkpointRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="检查点名称" prop="checkpointName">
              <el-input v-model="form.checkpointName" placeholder="请输入名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检查点编码" prop="checkpointCode">
              <el-input v-model="form.checkpointCode" placeholder="请输入编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="检查点类型" prop="checkpointType">
              <el-select v-model="form.checkpointType" placeholder="请选择">
                <el-option label="目视检查" value="visual" />
                <el-option label="抄表" value="meter_reading" />
                <el-option label="设备检查" value="equipment" />
                <el-option label="环境检查" value="env" />
                <el-option label="安全检查" value="safety" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序号" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="关联实体类型" prop="refType">
              <el-select v-model="form.refType" placeholder="请选择" clearable>
                <el-option label="分区" value="zone" />
                <el-option label="水厂" value="station" />
                <el-option label="设备" value="device" />
                <el-option label="管线" value="pipe" />
                <el-option label="监测点" value="point" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联实体编码" prop="refCode">
              <el-input v-model="form.refCode" placeholder="关联实体编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="关联实体名称" prop="refName">
              <el-input v-model="form.refName" placeholder="关联实体名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="经度" prop="lng">
              <el-input v-model="form.lng" placeholder="经度" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度" prop="lat">
              <el-input v-model="form.lat" placeholder="纬度" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="地址" prop="address">
              <el-input v-model="form.address" placeholder="位置描述" />
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

    <!-- 检查项查看对话框 -->
    <el-dialog :title="'检查项 - ' + currentCheckpoint.checkpointName" v-model="itemsOpen" width="700px" append-to-body>
      <el-table :data="checkItems" border>
        <el-table-column label="检查项名称" prop="itemName" />
        <el-table-column label="类型" prop="itemType">
          <template #default="scope">
            <el-tag size="small">{{ itemTypeMap[scope.row.itemType] || scope.row.itemType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="必填" prop="isRequired" width="60">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.isRequired === '1' ? 'danger' : 'info'">{{ scope.row.isRequired === '1' ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="拍照" prop="requirePhoto" width="60">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.requirePhoto === '1' ? 'warning' : 'info'">{{ scope.row.requirePhoto === '1' ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sortOrder" width="60" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance } from 'vue'
import { listCheckpoint, getCheckpoint, addCheckpoint, updateCheckpoint, delCheckpoint } from '@/api/inspection/checkpoint'

const { proxy } = getCurrentInstance()

const checkpointTypeMap = { visual: '目视检查', meter_reading: '抄表', equipment: '设备检查', env: '环境检查', safety: '安全检查', other: '其他' }
const refTypeMap = { zone: '分区', station: '水厂', device: '设备', pipe: '管线', point: '监测点' }
const itemTypeMap = { normal: '普通', threshold: '阈值', select: '选择', photo: '拍照', measurement: '测量', signature: '签名' }

const checkpointList = ref([])
const checkItems = ref([])
const open = ref(false)
const itemsOpen = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const currentCheckpoint = ref({})

const queryParams = reactive({ pageNum: 1, pageSize: 10, checkpointName: undefined, checkpointType: undefined })
const form = reactive({})
const rules = reactive({
  checkpointName: [{ required: true, message: '检查点名称不能为空', trigger: 'blur' }],
})

function getList() {
  loading.value = true
  listCheckpoint(queryParams).then(res => {
    checkpointList.value = res.data.list
    total.value = res.data.total
    loading.value = false
  })
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(i => i.id); single.value = selection.length !== 1; multiple.value = !selection.length }

function reset() {
  Object.assign(form, { id: undefined, checkpointName: '', checkpointCode: '', checkpointType: 'visual', refType: undefined, refCode: '', refName: '', lng: '', lat: '', address: '', sortOrder: 0 })
  proxy.resetForm('checkpointRef')
}

function handleAdd() { reset(); open.value = true; title.value = '新增检查点' }

function handleUpdate(row) {
  reset()
  const id = row.id || ids.value[0]
  getCheckpoint(id).then(res => { Object.assign(form, res.data); open.value = true; title.value = '修改检查点' })
}

function submitForm() {
  proxy.$refs.checkpointRef.validate(valid => {
    if (!valid) return
    if (form.id) { updateCheckpoint(form).then(() => { proxy.$modal.msgSuccess('修改成功'); open.value = false; getList() }) }
    else { addCheckpoint(form).then(() => { proxy.$modal.msgSuccess('新增成功'); open.value = false; getList() }) }
  })
}

function cancel() { open.value = false; reset() }

function handleDelete(row) {
  const delIds = row.id ? [row.id] : ids.value
  proxy.$modal.confirm('确认删除选中的检查点？').then(() => delCheckpoint(delIds[0])).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') })
}

function handleViewItems(row) {
  currentCheckpoint.value = row
  getCheckpoint(row.id).then(res => {
    checkItems.value = res.data.items || []
    itemsOpen.value = true
  })
}

getList()
</script>
