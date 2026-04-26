<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['data-integration:task:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-dropdown @command="handleTemplateAdd">
          <el-button type="success" plain icon="DocumentCopy">
            内置模板生成 <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="zone">分区 (Zone) 定时同步模板</el-dropdown-item>
              <el-dropdown-item command="station">站点 (Station) 定时同步模板</el-dropdown-item>
              <el-dropdown-item command="device">设备 (Device) 定时同步模板</el-dropdown-item>
              <el-dropdown-item command="point">测点 (Point) 定时同步模板</el-dropdown-item>
              <el-dropdown-item command="user">营收基础用户 定时同步模板</el-dropdown-item>
              <el-dropdown-item divided command="scada">SCADA 时序数据 同步模板</el-dropdown-item>
              <el-dropdown-item command="revenue">营收日度/月度水量 同步模板</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
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
      <el-table-column label="目标表/实体" align="center" prop="targetEntity" width="150" :show-overflow-tooltip="true" />
      <el-table-column label="自动补全" align="center" prop="autoBackfill" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.autoBackfill ? 'success' : 'info'">{{ scope.row.autoBackfill ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="目标表/实体" align="center" prop="targetEntity" width="150" :show-overflow-tooltip="true" />
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
    <el-dialog :title="title" v-model="open" width="680px" append-to-body custom-class="premium-dialog">
      <div class="dialog-header-desc" v-if="title === '通过内置模板创建任务'">
        <el-icon><MagicStick /></el-icon> 您正在使用智能模板，系统已自动填充标准参数，您只需检查确认即可。
      </div>
      <el-form ref="taskRef" :model="form" :rules="rules" label-width="140px" label-position="left" class="premium-form">
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <el-form-item label="任务名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入直观的任务名称，如：分区基础数据同步" />
          </el-form-item>
          <el-form-item label="数据源" prop="sourceId">
            <el-select v-model="form.sourceId" placeholder="请选择来源数据库或中间件" style="width: 100%" @change="handleSourceChange" class="custom-select">
              <el-option v-for="s in sourceList" :key="s.id" :label="s.name" :value="s.id">
                <span style="float: left">{{ s.name }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">{{ s.type }}</span>
              </el-option>
            </el-select>
          </el-form-item>
        </div>

        <div class="form-section" v-if="isTimingTask(form.sourceId)">
          <div class="section-title">调度与提取策略</div>
          <el-form-item label="Cron表达式" prop="cronExpression">
            <div class="cron-container">
              <el-select v-model="quickCron" placeholder="快捷选择执行频率" @change="val => form.cronExpression = val" class="quick-cron-select">
                <el-option label="每 1 分钟" value="0 * * * * ?" />
                <el-option label="每 5 分钟" value="0 0/5 * * * ?" />
                <el-option label="每 10 分钟" value="0 0/10 * * * ?" />
                <el-option label="每半小时" value="0 0/30 * * * ?" />
                <el-option label="每 1 小时" value="0 0 * * * ?" />
                <el-option label="每天凌晨0点" value="0 0 0 * * ?" />
                <el-option label="每天凌晨2点" value="0 0 2 * * ?" />
                <el-option label="每月1号凌晨3点" value="0 0 3 1 * ?" />
              </el-select>
              <el-input v-model="form.cronExpression" placeholder="自定义 Cron (如: 0 * * * * ?)" class="custom-cron-input" />
            </div>
          </el-form-item>
          <el-form-item :label="getQueryLabel(form.sourceId)" prop="querySqlOrTopic">
            <el-input v-model="form.querySqlOrTopic" type="textarea" :rows="3" :placeholder="getQueryPlaceholder(form.sourceId)" class="code-textarea" />
            <div class="form-tip hint-box" v-if="form.querySqlOrTopic && form.querySqlOrTopic.includes('?')">
              <el-icon><InfoFilled /></el-icon>
              <span>在 SQL 语句中使用 <code>?</code> 代表上一次任务执行的增量时间戳（如: <code>UPDATE_TIME > ?</code>），引擎会自动替换并管理断点。</span>
            </div>
          </el-form-item>
        </div>

        <div class="form-section">
          <div class="section-title">目标设置</div>
          <el-form-item label="目标表(Target)" prop="targetEntity">
            <el-select v-model="form.targetEntity" placeholder="选择或输入：sys_zone、tdengine等" filterable allow-create clearable style="width: 100%">
              <el-option-group label="内置目标引擎">
                <el-option label="tdengine (时序数据库引擎)" value="tdengine" />
                <el-option label="revenue (内置营收引擎)" value="revenue" />
              </el-option-group>
              <el-option-group label="系统本地业务表">
                <el-option v-for="table in localTables" :key="table.tableName" :label="`${table.tableName}`" :value="table.tableName">
                  <span style="float: left">{{ table.tableName }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ table.tableComment }}</span>
                </el-option>
              </el-option-group>
            </el-select>
            <div class="form-tip">指明数据同步的最终去向。基础数据填系统表名，时序数据填 tdengine 或 revenue。</div>
          </el-form-item>
          <el-form-item label="自动补录历史" v-if="isTimingTask(form.sourceId) && form.targetEntity === 'tdengine'">
            <el-switch v-model="form.autoBackfill" active-text="开启" inactive-text="关闭" />
            <div class="form-tip">开启后，若单次抓取了跨越整点的大量历史数据，引擎将自动触发时序聚合重算。</div>
          </el-form-item>
          <el-form-item label="自动插值补全" v-if="isTimingTask(form.sourceId) && form.targetEntity === 'tdengine' && form.autoBackfill">
            <el-switch v-model="form.interpolation" active-text="开启" inactive-text="关闭" />
            <div class="form-tip">开启后，回填聚合数据时若存在空洞（如设备断网），将使用自动插值填补。</div>
          </el-form-item>
          <el-form-item label="任务状态" prop="status">
            <el-radio-group v-model="form.status" class="custom-radio-group">
              <el-radio label="0" class="radio-success">正常启动</el-radio>
              <el-radio label="1" class="radio-danger">暂不启用</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel" class="btn-cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm" class="btn-submit">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 字段映射配置对话框 -->
    <el-dialog title="字段映射配置 (Field Mapping)" v-model="mappingOpen" width="750px" append-to-body custom-class="premium-dialog">
      <div class="mapping-header">
        <div class="mapping-desc">
          <el-icon><Connection /></el-icon>
          <span>将外部数据源的字段，映射至系统内部的目标字段。</span>
        </div>
        <el-button type="primary" icon="Plus" @click="addMappingRow" class="btn-add-mapping">新增映射</el-button>
      </div>
      
      <div class="mapping-table-wrapper">
        <el-table :data="mappingList" style="width: 100%" class="mapping-table">
          <el-table-column label="源字段名 (Source Field)" align="center">
            <template #default="scope">
              <el-input v-model="scope.row.sourceField" placeholder="如: user_id" class="mapping-input" />
            </template>
          </el-table-column>
          <el-table-column width="60" align="center">
            <template #default>
              <el-icon class="mapping-arrow"><Right /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="目标数据库字段 (Target Field)" align="center">
            <template #default="scope">
              <el-select v-model="scope.row.targetField" placeholder="选择或输入" filterable allow-create class="mapping-select">
                <el-option-group label="时序数据 (TDengine)" v-if="currentTargetEntity === 'tdengine'">
                  <el-option label="设备编码 (deviceCode)" value="deviceCode" />
                  <el-option label="测点编码 (pointCode)" value="pointCode" />
                  <el-option label="监测数值 (value)" value="value" />
                  <el-option label="时间戳 (timestamp/ts)" value="timestamp" />
                </el-option-group>
                <el-option-group label="营收引擎 (Revenue)" v-if="currentTargetEntity === 'revenue'">
                  <el-option label="业务编号 (user_no)" value="user_no" />
                  <el-option label="营收用量 (val)" value="val" />
                  <el-option label="账单月份 (bill_month)" value="bill_month" />
                </el-option-group>
                <el-option-group :label="`目标表 ${currentTargetEntity} 字段`" v-if="localColumns.length > 0">
                  <el-option v-for="col in localColumns" :key="col.columnName" :label="`${col.columnName}`" :value="col.columnName">
                    <span style="float: left">{{ col.columnName }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">{{ col.columnComment }}</span>
                  </el-option>
                </el-option-group>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="80">
            <template #default="scope">
              <el-button type="danger" link icon="Delete" @click="removeMappingRow(scope.$index)" class="btn-delete-icon"></el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="mappingOpen = false" class="btn-cancel">取 消</el-button>
          <el-button type="primary" @click="submitMappingForm" class="btn-submit">保存映射关系</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DataTask">
import { ref, reactive, onMounted } from 'vue';
import { listTask, addTask, updateTask, delTask, listMapping, saveMappingBatch, listSource, listLocalTables, listLocalColumns } from '@/api/data-integration/config';
import { ElMessage, ElMessageBox } from 'element-plus';
import { MagicStick, InfoFilled, Connection, Right, ArrowDown, Plus, DocumentCopy, Setting, Edit, Delete } from '@element-plus/icons-vue';

const taskList = ref([]);
const sourceList = ref([]);
const localTables = ref([]);
const localColumns = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const title = ref('');

const mappingOpen = ref(false);
const mappingList = ref([]);
const currentTaskId = ref(null);
const currentTargetEntity = ref('');
const quickCron = ref(null);

const data = reactive({
  form: {
    status: '0',
    autoBackfill: false,
    interpolation: false
  },
  rules: {
    name: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
    sourceId: [{ required: true, message: '数据源不能为空', trigger: 'change' }],
    querySqlOrTopic: [{ required: true, message: '提取指令不能为空', trigger: 'blur' }],
    targetEntity: [{ required: true, message: '目标实体/表名不能为空', trigger: 'blur' }]
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

function loadLocalTables() {
  listLocalTables().then(response => {
    localTables.value = response.data || [];
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
  form.targetEntity = undefined;
  form.status = '0';
  form.autoBackfill = false;
  form.interpolation = false;
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
  form.interpolation = row.interpolation === 1 || row.interpolation === true;
  open.value = true;
  title.value = '修改接入任务';
}

function submitForm() {
  taskRef.value.validate(valid => {
    if (valid) {
      const submitData = { 
        ...form, 
        autoBackfill: form.autoBackfill ? 1 : 0,
        interpolation: form.interpolation ? 1 : 0 
      };
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
  currentTargetEntity.value = row.targetEntity || '';

  // 清空上一次的字段列表
  localColumns.value = [];

  listMapping(row.id).then(response => {
    mappingList.value = response.data || [];
    
    // 如果是本地表，则请求后端加载该表的全部字段供下拉选择，并在没有映射配置时自动初始化所有字段
    if (currentTargetEntity.value && currentTargetEntity.value !== 'tdengine' && currentTargetEntity.value !== 'revenue') {
      listLocalColumns(currentTargetEntity.value).then(res => {
        localColumns.value = res.data || [];
        
        // 如果后端返回的映射为空，自动根据表的所有字段生成默认映射行
        if (mappingList.value.length === 0 && localColumns.value.length > 0) {
          mappingList.value = localColumns.value.map(col => ({
            sourceField: col.columnName,
            targetField: col.columnName
          }));
        }
      });
    } else if (mappingList.value.length === 0) {
      // 给出一些基础模板提示（针对 tdengine / revenue 等内置引擎）
      mappingList.value = [
        { sourceField: 'id', targetField: 'code' },
        { sourceField: 'name', targetField: 'name' }
      ];
    }
    
    mappingOpen.value = true;
  });
}

function handleTemplateAdd(command) {
  reset();
  open.value = true;
  title.value = '通过内置模板创建任务';
  
  // 假定通常模板都连接到某个特定的数据源（或者用户创建后自己选）
  // 这里我们提供默认的数据结构和说明
  
  if (command === 'zone') {
    form.name = '定时同步分区基础数据';
    form.cronExpression = '0 0 2 * * ?'; // 每天凌晨2点
    quickCron.value = '0 0 2 * * ?';
    form.targetEntity = 'water_zone';
    form.querySqlOrTopic = 'SELECT id, name, parent_id, sort, remark, update_time FROM sys_zone WHERE update_time > ?';
  } else if (command === 'station') {
    form.name = '定时同步站点基础数据';
    form.cronExpression = '0 0 2 * * ?';
    quickCron.value = '0 0 2 * * ?';
    form.targetEntity = 'water_station';
    form.querySqlOrTopic = 'SELECT id, code, name, zone_code, type, lng, lat, update_time FROM sys_station WHERE update_time > ?';
  } else if (command === 'device') {
    form.name = '定时同步设备基础数据';
    form.cronExpression = '0 0 2 * * ?';
    quickCron.value = '0 0 2 * * ?';
    form.targetEntity = 'water_device';
    form.querySqlOrTopic = 'SELECT id, code, name, station_code, type, status, expected_cycle, update_time FROM sys_device WHERE update_time > ?';
  } else if (command === 'point') {
    form.name = '定时同步测点(变量)数据';
    form.cronExpression = '0 0 2 * * ?';
    quickCron.value = '0 0 2 * * ?';
    form.targetEntity = 'water_point';
    form.querySqlOrTopic = 'SELECT id, code, name, device_code, type, unit, expected_cycle, update_time FROM sys_point WHERE update_time > ?';
  } else if (command === 'user') {
    form.name = '定时同步营收用户档案';
    form.cronExpression = '0 0 2 * * ?';
    quickCron.value = '0 0 2 * * ?';
    form.targetEntity = 'water_revenue_user';
    form.querySqlOrTopic = 'SELECT user_no, user_name, zone_code, address, status, meter_no, install_date, update_time FROM third_revenue_user WHERE update_time > ?';
  } else if (command === 'scada') {
    form.name = 'SCADA 实时时序数据接入';
    form.cronExpression = '0 * * * * ?'; // 每分钟
    quickCron.value = '0 * * * * ?';
    form.targetEntity = 'tdengine';
    form.querySqlOrTopic = 'SELECT device_code, point_code, val, ts FROM third_scada_history WHERE ts > ?';
    form.autoBackfill = true;
    form.interpolation = true;
  } else if (command === 'revenue') {
    form.name = '营收水量账单定时抽取';
    form.cronExpression = '0 0 3 1 * ?'; // 每月1号凌晨3点
    quickCron.value = '0 0 3 1 * ?';
    form.targetEntity = 'revenue';
    form.querySqlOrTopic = 'SELECT user_no, zone_code, total_volume as val, bill_month as ts FROM third_revenue_bill WHERE bill_month > ?';
  }
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
  loadLocalTables();
  getList();
});
</script>

<style lang="scss" scoped>
.app-container {
  padding: 24px;
}

/* Premium Dialog Aesthetics */
:deep(.premium-dialog) {
  border-radius: 12px;
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);
  overflow: hidden;
  
  .el-dialog__header {
    background: linear-gradient(135deg, #f8fafc 0%, #f3f4f6 100%);
    margin-right: 0;
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
    
    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      letter-spacing: -0.01em;
    }
  }

  .el-dialog__body {
    padding: 0;
    background-color: #fafafa;
  }

  .el-dialog__footer {
    padding: 16px 24px;
    background-color: #ffffff;
    border-top: 1px solid #e5e7eb;
  }
}

.dialog-header-desc {
  padding: 12px 24px;
  background-color: #ecfdf5;
  color: #059669;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #d1fae5;
  
  .el-icon {
    font-size: 16px;
  }
}

/* Premium Form Styling */
.premium-form {
  padding: 24px;
  
  .form-section {
    background: #ffffff;
    border-radius: 8px;
    padding: 24px 24px 8px 24px;
    margin-bottom: 16px;
    border: 1px solid #f3f4f6;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    
    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f3f4f6;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #4b5563;
  }
}

.custom-select, .custom-cron-input, :deep(.el-input__wrapper), :deep(.el-textarea__inner) {
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

.code-textarea {
  :deep(.el-textarea__inner) {
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
    font-size: 13px;
    background-color: #f8fafc;
    color: #1e293b;
    border-color: #e2e8f0;
    
    &:focus {
      background-color: #ffffff;
      border-color: #3b82f6;
    }
  }
}

.cron-container {
  display: flex;
  gap: 12px;
  width: 100%;
  
  .quick-cron-select {
    flex: 0 0 180px;
  }
  
  .custom-cron-input {
    flex: 1;
  }
}

.form-tip {
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
  line-height: 1.4;
}

.hint-box {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  margin-top: 8px;
  padding: 10px 12px;
  background-color: #fffbeb;
  border-radius: 6px;
  border: 1px solid #fef3c7;
  color: #b45309;
  
  .el-icon {
    margin-top: 2px;
  }
  
  code {
    background-color: #fef3c7;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-weight: 600;
    color: #d97706;
  }
}

.custom-radio-group {
  display: flex;
  gap: 16px;
  
  :deep(.el-radio) {
    margin-right: 0;
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s;
    
    &.is-checked {
      &.radio-success {
        background-color: #f0fdf4;
        border-color: #10b981;
        .el-radio__label { color: #059669; font-weight: 600; }
      }
      &.radio-danger {
        background-color: #fef2f2;
        border-color: #ef4444;
        .el-radio__label { color: #dc2626; font-weight: 600; }
      }
    }
  }
}

/* Button Styles */
.btn-cancel {
  border-radius: 6px;
  font-weight: 500;
  border-color: #d1d5db;
  color: #4b5563;
  
  &:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
    color: #111827;
  }
}

.btn-submit {
  border-radius: 6px;
  font-weight: 500;
}

/* Mapping Dialog Styles */
.mapping-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  
  .mapping-desc {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #4b5563;
    font-size: 14px;
    font-weight: 500;
    
    .el-icon {
      font-size: 18px;
      color: #3b82f6;
    }
  }
}

.mapping-table-wrapper {
  padding: 24px;
}

.mapping-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
  
  :deep(th.el-table__cell) {
    background-color: #f8fafc;
    color: #4b5563;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
  }
}

.mapping-arrow {
  font-size: 16px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 50%;
}

.btn-delete-icon {
  font-size: 18px;
  padding: 8px;
  border-radius: 6px;
  
  &:hover {
    background-color: #fef2f2;
    color: #ef4444;
  }
}
</style>
