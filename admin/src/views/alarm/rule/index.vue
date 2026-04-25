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
      <el-form-item label="规则类型" prop="ruleType">
        <el-select v-model="queryParams.ruleType" placeholder="请选择规则类型" clearable>
          <el-option
            v-for="dict in sys_alarm_rule_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="正常" value="0" />
          <el-option label="停用" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
        >删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="ruleList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="规则ID" align="center" prop="ruleId" />
      <el-table-column label="规则名称" align="center" prop="ruleName" />
      <el-table-column label="规则类型" align="center" prop="ruleType">
        <template #default="scope">
          <dict-tag :options="sys_alarm_rule_type" :value="scope.row.ruleType" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">
            {{ scope.row.status === '0' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 添加或修改规则对话框 -->
    <el-dialog :title="title" v-model="open" width="800px" append-to-body>
      <el-form ref="ruleRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="规则名称" prop="ruleName">
              <el-input v-model="form.ruleName" placeholder="请输入规则名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规则类型" prop="ruleType">
              <el-select v-model="form.ruleType" placeholder="请选择规则类型" class="w-full">
                <el-option
                  v-for="dict in sys_alarm_rule_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="规则条件" prop="ruleConditions">
          <rule-builder v-model="form.ruleConditions" />
        </el-form-item>
        
        <el-form-item label="触发动作" prop="ruleActions">
          <el-input v-model="ruleActionsStr" type="textarea" :rows="3" placeholder="请输入JSON格式的动作配置" />
        </el-form-item>

        <el-row>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio label="0">正常</el-radio>
                <el-radio label="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
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
import { ref, reactive, toRefs, computed, getCurrentInstance } from 'vue';
import { listRule, getRule, addRule, updateRule, delRule } from '@/api/alarm/rule';
import RuleBuilder from './components/RuleBuilder.vue';

const { proxy } = getCurrentInstance();

// 使用字典
const sys_alarm_rule_type = ref([
  { label: '设备报警', value: '1' },
  { label: '分区报警', value: '2' },
  { label: '系统报警', value: '3' }
]); // 此处为了简单直接mock，实际应使用 useDict('sys_alarm_rule_type')

const ruleList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    ruleName: undefined,
    ruleType: undefined,
    status: undefined
  },
  rules: {
    ruleName: [{ required: true, message: "规则名称不能为空", trigger: "blur" }],
    ruleType: [{ required: true, message: "规则类型不能为空", trigger: "change" }]
  }
});

const { queryParams, form, rules } = toRefs(data);

// 动作JSON字符串绑定
const ruleActionsStr = computed({
  get: () => {
    return form.value.ruleActions ? JSON.stringify(form.value.ruleActions, null, 2) : '{\n  "action": "notify"\n}';
  },
  set: (val) => {
    try {
      form.value.ruleActions = JSON.parse(val);
    } catch (e) {
      // ignore invalid JSON while typing
    }
  }
});

// 解析时间（Mock实现，实际应来自全局 utils）
const parseTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

/** 查询规则列表 */
function getList() {
  loading.value = true;
  listRule(queryParams.value).then(response => {
    ruleList.value = response.rows || [];
    total.value = response.total || 0;
    loading.value = false;
  }).catch(() => {
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
    ruleId: undefined,
    ruleName: undefined,
    ruleType: "1",
    ruleConditions: { all: [] },
    ruleActions: { action: "notify" },
    status: "0",
    remark: undefined
  };
  proxy.$refs["ruleRef"]?.resetFields();
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.$refs["queryRef"]?.resetFields();
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.ruleId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加规则";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const ruleId = row.ruleId || ids.value[0];
  getRule(ruleId).then(response => {
    form.value = response.data;
    // 确保 conditions 是对象
    if (typeof form.value.ruleConditions === 'string') {
      try {
        form.value.ruleConditions = JSON.parse(form.value.ruleConditions);
      } catch(e) {
        form.value.ruleConditions = { all: [] };
      }
    }
    // 确保 actions 是对象
    if (typeof form.value.ruleActions === 'string') {
      try {
        form.value.ruleActions = JSON.parse(form.value.ruleActions);
      } catch(e) {
        form.value.ruleActions = { action: "notify" };
      }
    }
    open.value = true;
    title.value = "修改规则";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["ruleRef"].validate(valid => {
    if (valid) {
      // 提交时，确保保存格式正确
      const submitData = { ...form.value };
      if (submitData.ruleId != undefined) {
        updateRule(submitData).then(() => {
          proxy.$modal?.msgSuccess("修改成功") || alert("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addRule(submitData).then(() => {
          proxy.$modal?.msgSuccess("新增成功") || alert("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const ruleIds = row.ruleId || ids.value;
  if(confirm('是否确认删除规则编号为"' + ruleIds + '"的数据项？')) {
    delRule(ruleIds).then(() => {
      getList();
      proxy.$modal?.msgSuccess("删除成功") || alert("删除成功");
    });
  }
}

getList();
</script>

<style scoped>
.w-full {
  width: 100%;
}
</style>
