<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="规则名称" prop="ruleName">
        <el-input
          v-model="queryParams.ruleName"
          placeholder="请输入规则名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="报警级别" prop="alarmLevel">
        <el-select v-model="queryParams.alarmLevel" placeholder="请选择报警级别" clearable>
          <el-option
            v-for="dict in sys_alarm_level"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="处理状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择处理状态" clearable>
          <el-option
            v-for="dict in sys_alarm_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="historyList">
      <el-table-column label="报警ID" align="center" prop="alarmId" />
      <el-table-column label="规则名称" align="center" prop="ruleName" />
      <el-table-column label="报警级别" align="center" prop="alarmLevel">
        <template #default="scope">
          <dict-tag :options="sys_alarm_level" :value="scope.row.alarmLevel"/>
        </template>
      </el-table-column>
      <el-table-column label="报警内容" align="center" prop="alarmContent" :show-overflow-tooltip="true" />
      <el-table-column label="报警时间" align="center" prop="alarmTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.alarmTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="sys_alarm_status" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="处理人" align="center" prop="resolveBy" />
      <el-table-column label="处理时间" align="center" prop="resolveTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.resolveTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleResolve(scope.row)"
            v-if="scope.row.status === '0'"
            v-hasPermi="['alarm:history:resolve']"
          >处理</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 处理报警对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" top="5vh" append-to-body class="sys-dialog" destroy-on-close>
      <div class="dialog-scroll">
      <el-form ref="historyRef" :model="form" :rules="rules" label-width="80px">
        <div class="form-card">
          <div class="card-header">
            <span class="card-dot dot-orange"></span>
            <el-icon class="card-icon"><Edit /></el-icon>
            <span class="card-title">处理信息</span>
          </div>
          <div class="card-body">
            <el-form-item label="处理备注" prop="resolveRemark">
              <el-input v-model="form.resolveRemark" type="textarea" :rows="3" placeholder="请输入处理备注" />
            </el-form-item>
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

<script setup name="AlarmHistory">
import { listHistory, resolveHistory } from "@/api/alarm/history";
import { ref, reactive, toRefs, getCurrentInstance } from "vue";
import { Edit } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance();
const { sys_alarm_level, sys_alarm_status } = proxy.useDict('sys_alarm_level', 'sys_alarm_status');

const historyList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const title = ref("");
const total = ref(0);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    ruleName: undefined,
    alarmLevel: undefined,
    status: undefined
  },
  rules: {
    resolveRemark: [
      { required: true, message: "处理备注不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询报警历史列表 */
function getList() {
  loading.value = true;
  listHistory(queryParams.value).then(response => {
    historyList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    alarmId: undefined,
    resolveRemark: undefined
  };
  proxy.resetForm("historyRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 处理按钮操作 */
function handleResolve(row) {
  reset();
  form.value.alarmId = row.alarmId;
  open.value = true;
  title.value = "处理报警";
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["historyRef"].validate(valid => {
    if (valid) {
      resolveHistory(form.value).then(response => {
        proxy.$modal.msgSuccess("处理成功");
        open.value = false;
        getList();
      });
    }
  });
}

getList();
</script>

<style scoped>
:deep(.sys-dialog .el-dialog__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #ecf5ff 100%);
  border-bottom: 1px solid #e4e7ed;
  padding: 16px 24px;
  margin: 0;
}
:deep(.sys-dialog .el-dialog__title) {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.3px;
}
:deep(.sys-dialog .el-dialog__body) {
  padding: 0;
  background: #f8fafc;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(90vh - 110px);
}
:deep(.sys-dialog .el-dialog__footer) {
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
.card-dot { width: 8px; height: 8px; border-radius: 50%; background: #409eff; flex-shrink: 0; }
.card-dot.dot-orange { background: #f59e0b; }

.card-icon { font-size: 16px; color: #64748b; }
.card-title { font-size: 14px; font-weight: 600; color: #334155; }
.card-body { padding: 18px 20px; }
</style>
