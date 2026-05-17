<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="计划名称" prop="planName">
        <el-input v-model="queryParams.planName" placeholder="请输入计划名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="巡检类型" prop="planType">
        <el-select v-model="queryParams.planType" placeholder="请选择巡检类型" clearable>
          <el-option label="每日" value="daily" />
          <el-option label="每周" value="weekly" />
          <el-option label="每月" value="monthly" />
          <el-option label="每季" value="quarterly" />
          <el-option label="每年" value="yearly" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="planStatus">
        <el-select v-model="queryParams.planStatus" placeholder="请选择状态" clearable>
          <el-option label="草稿" value="draft" />
          <el-option label="生效中" value="active" />
          <el-option label="已暂停" value="paused" />
          <el-option label="已归档" value="archived" />
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

    <el-table v-loading="loading" :data="planList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="计划名称" align="center" prop="planName" />
      <el-table-column label="计划编码" align="center" prop="planCode" />
      <el-table-column label="巡检类型" align="center" prop="planType">
        <template #default="scope">
          <el-tag>{{ planTypeMap[scope.row.planType] || scope.row.planType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="planStatus">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.planStatus)">{{ planStatusMap[scope.row.planStatus] || scope.row.planStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="调度Cron" align="center" prop="scheduleCron" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope"><span>{{ parseTime(scope.row.createTime) }}</span></template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="primary" icon="Switch" @click="handleStatusChange(scope.row)">切换状态</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增/修改对话框 -->
    <el-dialog :title="title" v-model="open" width="700px" append-to-body>
      <el-form ref="planRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="计划名称" prop="planName">
              <el-input v-model="form.planName" placeholder="请输入计划名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划编码" prop="planCode">
              <el-input v-model="form.planCode" placeholder="请输入计划编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="巡检类型" prop="planType">
              <el-select v-model="form.planType" placeholder="请选择">
                <el-option label="每日" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="每月" value="monthly" />
                <el-option label="每季" value="quarterly" />
                <el-option label="每年" value="yearly" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="调度Cron" prop="scheduleCron">
              <el-input v-model="form.scheduleCron" placeholder="如: 0 9 * * *" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="关联路线" prop="routeId">
              <el-select v-model="form.routeId" placeholder="请选择路线" clearable>
                <el-option v-for="r in routeOptions" :key="r.id" :label="r.routeName" :value="r.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属部门" prop="deptId">
              <el-tree-select
                v-model="form.deptId"
                :data="deptOptions"
                :props="{ value: 'id', label: 'label', children: 'children' }"
                placeholder="请选择部门"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker v-model="form.startDate" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker v-model="form.endDate" type="date" placeholder="结束日期" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="提前生成天数" prop="advanceDays">
              <el-input-number v-model="form.advanceDays" :min="1" :max="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="超时小时数" prop="overdueHours">
              <el-input-number v-model="form.overdueHours" :min="1" :max="72" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="计划描述" prop="description">
              <el-input v-model="form.description" type="textarea" placeholder="请输入计划描述" />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
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

    <!-- 状态切换对话框 -->
    <el-dialog title="切换计划状态" v-model="statusOpen" width="400px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="当前状态">
          <el-tag :type="statusTagType(currentPlan.planStatus)">{{ planStatusMap[currentPlan.planStatus] }}</el-tag>
        </el-form-item>
        <el-form-item label="目标状态">
          <el-select v-model="targetStatus" placeholder="请选择目标状态">
            <el-option v-if="currentPlan.planStatus === 'draft'" label="生效中" value="active" />
            <el-option v-if="currentPlan.planStatus === 'active'" label="已暂停" value="paused" />
            <el-option v-if="currentPlan.planStatus === 'paused'" label="生效中" value="active" />
            <el-option v-if="currentPlan.planStatus !== 'archived'" label="已归档" value="archived" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="confirmStatusChange">确 定</el-button>
          <el-button @click="statusOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance } from 'vue'
import { listPlan, getPlan, addPlan, updatePlan, delPlan, updatePlanStatus } from '@/api/inspection/plan'
import { listRoute } from '@/api/inspection/route'
import { deptTreeSelect } from '@/api/system/user'

const { proxy } = getCurrentInstance()

const planTypeMap = { daily: '每日', weekly: '每周', monthly: '每月', quarterly: '每季', yearly: '每年', custom: '自定义' }
const planStatusMap = { draft: '草稿', active: '生效中', paused: '已暂停', archived: '已归档' }
const statusTagType = (s) => ({ draft: 'info', active: 'success', paused: 'warning', archived: '' }[s] || 'info')

const planList = ref([])
const open = ref(false)
const statusOpen = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const targetStatus = ref('')
const currentPlan = ref({})
const routeOptions = ref([])
const deptOptions = ref([])

const queryParams = reactive({ pageNum: 1, pageSize: 10, planName: undefined, planType: undefined, planStatus: undefined })
const form = reactive({})
const rules = reactive({
  planName: [{ required: true, message: '计划名称不能为空', trigger: 'blur' }],
  planType: [{ required: true, message: '巡检类型不能为空', trigger: 'change' }],
})

function getList() {
  loading.value = true
  listPlan(queryParams).then(res => {
    planList.value = res.data.list
    total.value = res.data.total
    loading.value = false
  })
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection) {
  ids.value = selection.map(i => i.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function reset() {
  Object.assign(form, { id: undefined, planName: '', planCode: '', planType: 'daily', scheduleCron: '', routeId: undefined, deptId: undefined, startDate: undefined, endDate: undefined, advanceDays: 7, overdueHours: 2, sort: 0, description: '', remark: '' })
  proxy.resetForm('planRef')
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '新增巡检计划'
}

function handleUpdate(row) {
  reset()
  const id = row.id || ids.value[0]
  getPlan(id).then(res => {
    Object.assign(form, res.data)
    open.value = true
    title.value = '修改巡检计划'
  })
}

function submitForm() {
  proxy.$refs.planRef.validate(valid => {
    if (!valid) return
    if (form.id) {
      updatePlan(form).then(() => { proxy.$modal.msgSuccess('修改成功'); open.value = false; getList() })
    } else {
      addPlan(form).then(() => { proxy.$modal.msgSuccess('新增成功'); open.value = false; getList() })
    }
  })
}

function cancel() { open.value = false; reset() }

function handleDelete(row) {
  const delIds = row.id ? [row.id] : ids.value
  proxy.$modal.confirm('确认删除选中的巡检计划？').then(() => {
    return delPlan(delIds[0])
  }).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') })
}

function handleStatusChange(row) {
  currentPlan.value = row
  targetStatus.value = ''
  statusOpen.value = true
}

function confirmStatusChange() {
  if (!targetStatus.value) return proxy.$modal.msgError('请选择目标状态')
  updatePlanStatus(currentPlan.value.id, targetStatus.value).then(() => {
    proxy.$modal.msgSuccess('状态更新成功')
    statusOpen.value = false
    getList()
  })
}

function loadOptions() {
  listRoute({ pageNum: 1, pageSize: 999 }).then(res => { routeOptions.value = res.data.list || [] })
  deptTreeSelect().then(res => { deptOptions.value = res.data || [] })
}

getList()
loadOptions()
</script>
