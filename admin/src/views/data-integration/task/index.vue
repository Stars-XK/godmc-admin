<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['data-integration:task:add']">新增</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="taskList">
      <el-table-column label="任务ID" align="center" prop="id" />
      <el-table-column label="任务名称" align="center" prop="name" />
      <el-table-column label="数据源" align="center" prop="sourceId">
        <template #default="scope">
          <span>{{ getSourceName(scope.row.sourceId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="执行频率(Cron)" align="center" prop="cronExpression" />
      <el-table-column label="提取指令" align="center" prop="querySqlOrTopic" show-overflow-tooltip />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">{{ scope.row.status === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="260">
        <template #default="scope">
          <el-button type="success" link icon="Setting" @click="handleMapping(scope.row)" v-hasPermi="['data-integration:task:mapping']">字段映射</el-button>
          <el-button type="primary" link icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['data-integration:task:edit']">修改</el-button>
          <el-button type="danger" link icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['data-integration:task:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改任务对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="taskRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="数据源" prop="sourceId">
          <el-select v-model="form.sourceId" placeholder="请选择数据源" style="width: 100%" @change="handleSourceChange">
            <el-option v-for="s in sourceList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Cron表达式" prop="cronExpression" v-if="isTimingTask(form.sourceId)">
          <el-row :gutter="10" style="width: 100%">
            <el-col :span="8">
              <el-select v-model="quickCron" placeholder="快捷选择" @change="val => form.cronExpression = val">
                <el-option label="每 10 秒" value="0/10 * * * * ?" />
                <el-option label="每 1 分钟" value="0 * * * * ?" />
                <el-option label="每 5 分钟" value="0 0/5 * * * ?" />
                <el-option label="每 1 小时" value="0 0 * * * ?" />
                <el-option label="每天凌晨0点" value="0 0 0 * * ?" />
              </el-select>
            </el-col>
            <el-col :span="16">
              <el-input v-model="form.cronExpression" placeholder="或者手动输入(如: 0 * * * * ?)" />
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item :label="getQueryLabel(form.sourceId)" prop="querySqlOrTopic">
          <el-input v-model="form.querySqlOrTopic" type="textarea" :placeholder="getQueryPlaceholder(form.sourceId)" />
        </el-form-item>
        <el-form-item label="自动补录历史">
          <el-switch v-model="form.autoBackfill" active-text="开启" inactive-text="关闭" />
          <div class="el-upload__tip">开启后，若单次抓取了跨越整点的大量历史数据，引擎将自动触发时序聚合重算。</div>
        </el-form-item>
        <el-form-item label="任务状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 字段映射配置对话框 -->
    <el-dialog title="字段映射配置" v-model="mappingOpen" width="700px" append-to-body>
      <div class="mb8">
        <el-button type="primary" icon="Plus" @click="addMappingRow">添加映射</el-button>
      </div>
      <el-table :data="mappingList" border>
        <el-table-column label="源字段名" align="center">
          <template #default="scope">
            <el-input v-model="scope.row.sourceField" placeholder="JSON/SQL中的字段名" />
          </template>
        </el-table-column>
        <el-table-column label="目标TDengine字段" align="center">
          <template #default="scope">
            <el-select v-model="scope.row.targetField" placeholder="请选择" style="width: 100%">
              <el-option label="设备编码 (deviceCode)" value="deviceCode" />
              <el-option label="测点编码 (pointCode)" value="pointCode" />
              <el-option label="监测数值 (value)" value="value" />
              <el-option label="时间戳 (timestamp)" value="timestamp" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100">
          <template #default="scope">
            <el-button type="danger" link icon="Delete" @click="removeMappingRow(scope.$index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitMappingForm">保存映射</el-button>
          <el-button @click="mappingOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DataTask">
import { ref, reactive, onMounted } from 'vue';
import { listTask, addTask, updateTask, delTask, listMapping, saveMappingBatch, listSource } from '@/api/data-integration/config';
import { ElMessage, ElMessageBox } from 'element-plus';

const taskList = ref([]);
const sourceList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const title = ref('');

const mappingOpen = ref(false);
const mappingList = ref([]);
const currentTaskId = ref(null);
const quickCron = ref(null);

const data = reactive({
  form: {
    status: '0',
    autoBackfill: false
  },
  rules: {
    name: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
    sourceId: [{ required: true, message: '数据源不能为空', trigger: 'change' }]
  }
});

const { form, rules } = data;
const taskRef = ref(null);

function getList() {
  loading.value = true;
  listTask().then(response => {
    taskList.value = response.data;
    loading.value = false;
  });
}

function loadSources() {
  listSource().then(response => {
    sourceList.value = response.data;
  });
}

function getSourceName(sourceId) {
  const s = sourceList.value.find(item => item.id === sourceId);
  return s ? s.name : sourceId;
}

function getSourceType(sourceId) {
  const s = sourceList.value.find(item => item.id === sourceId);
  return s ? s.type : '';
}

function isTimingTask(sourceId) {
  const type = getSourceType(sourceId);
  return type === 'MYSQL' || type === 'POSTGRESQL' || type === 'FILE';
}

function getQueryLabel(sourceId) {
  const type = getSourceType(sourceId);
  switch (type) {
    case 'MYSQL':
    case 'POSTGRESQL':
      return 'SQL 查询语句';
    case 'KAFKA':
      return 'Topic 名称';
    case 'FILE':
      return '文件匹配模式';
    case 'HTTP':
      return '推送标识后缀';
    default:
      return '提取指令';
  }
}

function getQueryPlaceholder(sourceId) {
  const type = getSourceType(sourceId);
  switch (type) {
    case 'MYSQL':
    case 'POSTGRESQL':
      return '例如: SELECT * FROM device_data WHERE sync_flag = 0';
    case 'KAFKA':
      return '例如: water_device_topic';
    case 'FILE':
      return '例如: *.csv 或 data_2023.json';
    case 'HTTP':
      return '选填。如果留空，推送地址为 /receiver/push/{taskId}';
    default:
      return '请选择数据源类型';
  }
}

function handleSourceChange() {
  form.querySqlOrTopic = '';
}

function cancel() {
  open.value = false;
  reset();
}

function reset() {
  form.id = undefined;
  form.name = undefined;
  form.sourceId = undefined;
  form.cronExpression = undefined;
  form.querySqlOrTopic = undefined;
  form.status = '0';
  form.autoBackfill = false;
  quickCron.value = null;
  if (taskRef.value) taskRef.value.resetFields();
}

function handleAdd() {
  reset();
  open.value = true;
  title.value = '添加接入任务';
}

function handleUpdate(row) {
  reset();
  form.id = row.id;
  form.name = row.name;
  form.sourceId = row.sourceId;
  form.cronExpression = row.cronExpression;
  form.querySqlOrTopic = row.querySqlOrTopic;
  form.status = row.status;
  form.autoBackfill = row.autoBackfill === 1 || row.autoBackfill === true;
  open.value = true;
  title.value = '修改接入任务';
}

function submitForm() {
  taskRef.value.validate(valid => {
    if (valid) {
      const submitData = { ...form, autoBackfill: form.autoBackfill ? 1 : 0 };
      if (form.id != null) {
        updateTask(submitData).then(response => {
          ElMessage.success('修改成功');
          open.value = false;
          getList();
        });
      } else {
        addTask(submitData).then(response => {
          ElMessage.success('新增成功');
          open.value = false;
          getList();
        });
      }
    }
  });
}

function handleDelete(row) {
  ElMessageBox.confirm('是否确认删除名称为"' + row.name + '"的任务?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(function () {
    return delTask(row.id);
  }).then(() => {
    getList();
    ElMessage.success('删除成功');
  }).catch(() => {});
}

// 映射配置相关
function handleMapping(row) {
  currentTaskId.value = row.id;
  listMapping(row.id).then(response => {
    mappingList.value = response.data || [];
    mappingOpen.value = true;
  });
}

function addMappingRow() {
  mappingList.value.push({ sourceField: '', targetField: '' });
}

function removeMappingRow(index) {
  mappingList.value.splice(index, 1);
}

function submitMappingForm() {
  const invalid = mappingList.value.some(item => !item.sourceField || !item.targetField);
  if (invalid) {
    ElMessage.warning('映射字段名不能为空');
    return;
  }
  saveMappingBatch(currentTaskId.value, mappingList.value).then(() => {
    ElMessage.success('映射保存成功');
    mappingOpen.value = false;
  });
}

onMounted(() => {
  loadSources();
  getList();
});
</script>
