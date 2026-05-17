<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="任务名称" prop="taskName">
        <el-input v-model="queryParams.taskName" placeholder="请输入任务名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="任务状态" prop="taskStatus">
        <el-select v-model="queryParams.taskStatus" placeholder="请选择状态" clearable>
          <el-option label="待接受" value="pending" />
          <el-option label="已接受" value="accepted" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已提交" value="submitted" />
          <el-option label="已审核" value="reviewed" />
          <el-option label="已关闭" value="closed" />
          <el-option label="已超时" value="overdue" />
        </el-select>
      </el-form-item>
      <el-form-item label="巡检员" prop="assignedUserId">
        <el-input v-model="queryParams.assignedUserId" placeholder="请输入巡检员ID" clearable />
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

    <el-table v-loading="loading" :data="taskList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="任务编号" align="center" prop="taskCode" width="180" />
      <el-table-column label="任务名称" align="center" prop="taskName" show-overflow-tooltip />
      <el-table-column label="巡检员" align="center" prop="assignedUserName" />
      <el-table-column label="状态" align="center" prop="taskStatus">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.taskStatus)">{{ taskStatusMap[scope.row.taskStatus] || scope.row.taskStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="完成率" align="center" prop="completionRatio">
        <template #default="scope">
          <el-progress :percentage="scope.row.completionRatio" :stroke-width="6" />
        </template>
      </el-table-column>
      <el-table-column label="截止时间" align="center" prop="deadline" width="180">
        <template #default="scope"><span>{{ parseTime(scope.row.deadline) }}</span></template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleDetail(scope.row)">详情</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/修改对话框 -->
    <el-dialog :title="title" v-model="open" width="650px" append-to-body>
      <el-form ref="taskRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="任务名称" prop="taskName">
              <el-input v-model="form.taskName" placeholder="请输入任务名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务编号" prop="taskCode">
              <el-input v-model="form.taskCode" placeholder="自动生成或手动输入" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="巡检员ID" prop="assignedUserId">
              <el-input-number v-model="form.assignedUserId" :min="1" placeholder="巡检员用户ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="巡检员姓名" prop="assignedUserName">
              <el-input v-model="form.assignedUserName" placeholder="巡检员姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="关联计划" prop="planId">
              <el-input-number v-model="form.planId" :min="1" placeholder="计划ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联路线" prop="routeId">
              <el-input-number v-model="form.routeId" :min="1" placeholder="路线ID" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="截止时间" prop="deadline">
              <el-date-picker v-model="form.deadline" type="datetime" placeholder="截止时间" value-format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检查点总数" prop="totalCheckpoints">
              <el-input-number v-model="form.totalCheckpoints" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
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
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance } from 'vue'
import { listTask, getTask, addTask, updateTask, delTask } from '@/api/inspection/task'

const { proxy } = getCurrentInstance()

const taskStatusMap = { pending: '待接受', accepted: '已接受', in_progress: '进行中', submitted: '已提交', reviewed: '已审核', closed: '已关闭', overdue: '已超时' }
const statusTagType = (s) => ({ pending: 'info', accepted: '', in_progress: 'warning', submitted: 'primary', reviewed: 'success', closed: 'info', overdue: 'danger' }[s] || 'info')

const taskList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

const queryParams = reactive({ pageNum: 1, pageSize: 10, taskName: undefined, taskStatus: undefined, assignedUserId: undefined })
const form = reactive({})
const rules = reactive({
  taskName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  assignedUserId: [{ required: true, message: '巡检员ID不能为空', trigger: 'blur' }],
  deadline: [{ required: true, message: '截止时间不能为空', trigger: 'change' }],
})

function getList() {
  loading.value = true
  listTask(queryParams).then(res => {
    taskList.value = res.data.list
    total.value = res.data.total
    loading.value = false
  })
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(i => i.id); single.value = selection.length !== 1; multiple.value = !selection.length }

function reset() {
  Object.assign(form, { id: undefined, taskName: '', taskCode: '', planId: undefined, routeId: undefined, assignedUserId: undefined, assignedUserName: '', deadline: undefined, totalCheckpoints: 0, remark: '' })
  proxy.resetForm('taskRef')
}

function handleAdd() { reset(); open.value = true; title.value = '新增巡检任务' }

function handleUpdate(row) {
  reset()
  const id = row.id || ids.value[0]
  getTask(id).then(res => { Object.assign(form, res.data); open.value = true; title.value = '修改巡检任务' })
}

function submitForm() {
  proxy.$refs.taskRef.validate(valid => {
    if (!valid) return
    if (form.id) { updateTask(form).then(() => { proxy.$modal.msgSuccess('修改成功'); open.value = false; getList() }) }
    else { addTask(form).then(() => { proxy.$modal.msgSuccess('新增成功'); open.value = false; getList() }) }
  })
}

function cancel() { open.value = false; reset() }

function handleDelete(row) {
  const delIds = row.id ? [row.id] : ids.value
  proxy.$modal.confirm('确认删除选中的巡检任务？').then(() => delTask(delIds[0])).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') })
}

function handleDetail(row) {
  // Will navigate to detail page in Phase 2
  proxy.$modal.msgInfo('任务详情页将在 Phase 2 实现')
}

getList()
</script>
