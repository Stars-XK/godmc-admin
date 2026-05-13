<template>
  <div class="app-container">
    <el-card class="box-card mb8">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
        <el-form-item label="用户编号" prop="userNo">
          <el-input v-model="queryParams.userNo" placeholder="请输入用户编号" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="账单周期" prop="billPeriod">
          <el-date-picker
            v-model="queryParams.billPeriod"
            type="month"
            format="YYYY-MM"
            value-format="YYYY-MM"
            placeholder="选择月份"
            clearable
          />
        </el-form-item>
        <el-form-item label="账单状态" prop="billStatus">
          <el-select v-model="queryParams.billStatus" placeholder="请选择状态" clearable>
            <el-option v-for="dict in water_bill_status" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="分区编码" prop="zoneCode">
          <el-input v-model="queryParams.zoneCode" placeholder="请输入分区编码" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['water-basic:billing:add']">新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['water-basic:billing:export']">导出</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
      </el-row>
    </el-card>

    <el-card class="box-card flex-card">
      <el-table v-loading="loading" :data="billList" class="flex-table">
        <el-table-column type="index" width="50" align="center" />
        <el-table-column label="用户编号" align="center" prop="userNo" min-width="140">
          <template #default="scope">
            <el-icon class="mr-1" color="#409EFC"><User /></el-icon>
            <span>{{ scope.row.userNo }}</span>
          </template>
        </el-table-column>
        <el-table-column label="账单周期" align="center" prop="billPeriod" width="110">
          <template #default="scope">
            <el-tag type="info" size="small">{{ scope.row.billPeriod }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用水量(m³)" align="right" prop="waterUsage" width="130">
          <template #default="scope">
            <span class="text-primary font-bold">{{ Number(scope.row.waterUsage || 0).toFixed(3) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单价(元)" align="right" prop="unitPrice" width="110">
          <template #default="scope">{{ Number(scope.row.unitPrice || 0).toFixed(4) }}</template>
        </el-table-column>
        <el-table-column label="总金额(元)" align="right" width="130">
          <template #default="scope">
            <span class="text-primary font-bold">{{ Number(scope.row.totalAmount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已缴(元)" align="right" width="120">
          <template #default="scope">
            <span class="text-success font-medium">{{ Number(scope.row.paidAmount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="未缴(元)" align="right" width="120">
          <template #default="scope">
            <span :class="Number(scope.row.unpaidAmount) > 0 ? 'text-danger font-bold' : 'text-success'">
              {{ Number(scope.row.unpaidAmount || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="scope">
            <dict-tag :options="water_bill_status" :value="scope.row.billStatus" />
          </template>
        </el-table-column>
        <el-table-column label="缴费时间" align="center" width="160">
          <template #default="scope">
            <span v-if="scope.row.payTime" class="text-sm">{{ scope.row.payTime }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="生成时间" align="center" width="160">
          <template #default="scope">
            <span class="text-sm text-gray">{{ scope.row.generateTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['water-basic:billing:edit']">修改</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['water-basic:billing:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 添加/修改账单对话框 -->
    <el-dialog :title="title" v-model="open" width="780px" top="5vh" append-to-body class="equip-dialog" destroy-on-close>
      <div class="dialog-scroll">
      <el-form ref="billRef" :model="form" :rules="rules" label-width="110px">
        <div class="form-card">
          <div class="card-header">
            <span class="card-dot"></span>
            <el-icon class="card-icon"><Document /></el-icon>
            <span class="card-title">基本信息</span>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="用户编号" prop="userNo">
                  <el-input v-model="form.userNo" placeholder="请输入用户编号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="账单周期" prop="billPeriod">
                  <el-date-picker
                    v-model="form.billPeriod"
                    type="month"
                    format="YYYY-MM"
                    value-format="YYYY-MM"
                    placeholder="选择月份"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="分区编码" prop="zoneCode">
                  <el-input v-model="form.zoneCode" placeholder="请输入分区编码" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <div class="form-card">
          <div class="card-header">
            <span class="card-dot dot-purple"></span>
            <el-icon class="card-icon"><Money /></el-icon>
            <span class="card-title">费用信息</span>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="用水量(m³)" prop="waterUsage">
                  <el-input-number v-model="form.waterUsage" :min="0" :precision="3" :step="1" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="单价(元/m³)" prop="unitPrice">
                  <el-input-number v-model="form.unitPrice" :min="0" :precision="4" :step="0.5" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="总金额(元)" prop="totalAmount">
                  <el-input-number v-model="form.totalAmount" :min="0" :precision="2" :step="10" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="已缴金额(元)" prop="paidAmount">
                  <el-input-number v-model="form.paidAmount" :min="0" :precision="2" :step="10" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="未缴金额(元)">
                  <el-input-number :model-value="unpaidComputed" :min="0" :precision="2" disabled style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <div class="form-card">
          <div class="card-header">
            <span class="card-dot dot-green"></span>
            <el-icon class="card-icon"><Setting /></el-icon>
            <span class="card-title">状态信息</span>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="账单状态" prop="billStatus">
                  <el-select v-model="form.billStatus" style="width: 100%">
                    <el-option v-for="dict in water_bill_status" :key="dict.value" :label="dict.label" :value="dict.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="缴费时间" prop="payTime">
                  <el-date-picker v-model="form.payTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择缴费时间" style="width: 100%" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { User, Document, Money, Setting } from '@element-plus/icons-vue'
import { listBill, getBill, addBill, updateBill, delBill } from '@/api/water-basic/billing'

const { proxy } = getCurrentInstance()
const { water_bill_status } = proxy.useDict('water_bill_status')

const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const billList = ref([])

const form = ref({})
const queryParams = ref({ pageNum: 1, pageSize: 20, userNo: undefined, billPeriod: undefined, billStatus: undefined, zoneCode: undefined })

const rules = {
  userNo: [{ required: true, message: '用户编号不能为空', trigger: 'blur' }],
  billPeriod: [{ required: true, message: '请选择账单周期', trigger: 'change' }],
}

const open = ref(false)
const title = ref('')

const unpaidComputed = computed(() => {
  return Number(((form.value.totalAmount || 0) - (form.value.paidAmount || 0)).toFixed(2))
})

function reset() {
  form.value = {
    billId: undefined, userNo: undefined, zoneCode: undefined, billPeriod: undefined,
    waterUsage: 0, unitPrice: 3.5, totalAmount: 0, paidAmount: 0,
    billStatus: '0', payTime: undefined,
  }
  proxy.resetForm('billRef')
}

function handleAdd() {
  reset()
  open.value = true
  title.value = '新增水费账单'
}

function handleUpdate(row) {
  reset()
  getBill(row.billId).then(res => {
    form.value = res.data
    open.value = true
    title.value = '修改水费账单'
  })
}

function submitForm() {
  proxy.$refs['billRef'].validate(valid => {
    if (valid) {
      form.value.unpaidAmount = unpaidComputed.value
      if (form.value.billId != undefined) {
        updateBill(form.value).then(() => {
          proxy.$modal.msgSuccess('修改成功')
          open.value = false
          getList()
        })
      } else {
        form.value.generateTime = new Date().toISOString()
        addBill(form.value).then(() => {
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

function getList() {
  loading.value = true
  listBill(queryParams.value).then(res => {
    billList.value = res.data.list
    total.value = res.data.total
    loading.value = false
  })
}

function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }

function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除用户"' + row.userNo + '"的账单？').then(() => {
    return delBill(row.billId)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

function handleExport() {
  proxy.download('/water-basic/billing/export', { ...queryParams.value }, `billing_${new Date().getTime()}.xlsx`)
}

onMounted(() => { getList() })
</script>

<style scoped>
.mr-1 { margin-right: 5px; vertical-align: middle; }

.flex-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.flex-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.flex-table {
  flex: 1;
  min-height: 0;
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

.text-primary { color: #409EFF; }
.text-success { color: #67C23A; }
.text-danger { color: #F56C6C; }
.text-gray { color: #909399; }
.text-sm { font-size: 13px; }
.font-bold { font-weight: 700; }
.font-medium { font-weight: 500; }

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

.card-icon { font-size: 16px; color: #64748b; }
.card-title { font-size: 14px; font-weight: 600; color: #334155; }
.card-body { padding: 18px 20px; }
</style>
