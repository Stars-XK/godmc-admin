<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="路线名称" prop="routeName">
        <el-input v-model="queryParams.routeName" placeholder="请输入路线名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="路线编码" prop="routeCode">
        <el-input v-model="queryParams.routeCode" placeholder="请输入路线编码" clearable />
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

    <el-table v-loading="loading" :data="routeList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="路线名称" align="center" prop="routeName" />
      <el-table-column label="路线编码" align="center" prop="routeCode" />
      <el-table-column label="检查点数" align="center" prop="checkpointCount" />
      <el-table-column label="预计耗时(分)" align="center" prop="estimatedDuration" />
      <el-table-column label="总距离(米)" align="center" prop="totalDistance" />
      <el-table-column label="围栏半径(米)" align="center" prop="geofenceRadius" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope"><span>{{ parseTime(scope.row.createTime) }}</span></template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/修改对话框 -->
    <el-dialog :title="title" v-model="open" width="650px" append-to-body>
      <el-form ref="routeRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="路线名称" prop="routeName">
              <el-input v-model="form.routeName" placeholder="请输入路线名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="路线编码" prop="routeCode">
              <el-input v-model="form.routeCode" placeholder="请输入路线编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="预计耗时(分)" prop="estimatedDuration">
              <el-input-number v-model="form.estimatedDuration" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总距离(米)" prop="totalDistance">
              <el-input-number v-model="form.totalDistance" :min="0" :precision="2" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="围栏半径(米)" prop="geofenceRadius">
              <el-input-number v-model="form.geofenceRadius" :min="10" :max="500" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序号" prop="sort">
              <el-input-number v-model="form.sort" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="路线描述" prop="description">
              <el-input v-model="form.description" type="textarea" placeholder="请输入路线描述" />
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
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance } from 'vue'
import { listRoute, getRoute, addRoute, updateRoute, delRoute } from '@/api/inspection/route'

const { proxy } = getCurrentInstance()

const routeList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const queryParams = reactive({ pageNum: 1, pageSize: 10, routeName: undefined, routeCode: undefined })
const form = reactive({})
const rules = reactive({
  routeName: [{ required: true, message: '路线名称不能为空', trigger: 'blur' }],
})

function getList() {
  loading.value = true
  listRoute(queryParams).then(res => {
    routeList.value = res.data.list
    total.value = res.data.total
    loading.value = false
  })
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(i => i.id); single.value = selection.length !== 1; multiple.value = !selection.length }

function reset() {
  Object.assign(form, { id: undefined, routeName: '', routeCode: '', estimatedDuration: 0, totalDistance: 0, geofenceRadius: 50, sort: 0, description: '' })
  proxy.resetForm('routeRef')
}

function handleAdd() { reset(); open.value = true; title.value = '新增巡检路线' }

function handleUpdate(row) {
  reset()
  const id = row.id || ids.value[0]
  getRoute(id).then(res => { Object.assign(form, res.data); open.value = true; title.value = '修改巡检路线' })
}

function submitForm() {
  proxy.$refs.routeRef.validate(valid => {
    if (!valid) return
    if (form.id) { updateRoute(form).then(() => { proxy.$modal.msgSuccess('修改成功'); open.value = false; getList() }) }
    else { addRoute(form).then(() => { proxy.$modal.msgSuccess('新增成功'); open.value = false; getList() }) }
  })
}

function cancel() { open.value = false; reset() }

function handleDelete(row) {
  const delIds = row.id ? [row.id] : ids.value
  proxy.$modal.confirm('确认删除选中的巡检路线？').then(() => delRoute(delIds[0])).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') })
}

getList()
</script>
