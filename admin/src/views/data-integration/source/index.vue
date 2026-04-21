<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['data-integration:source:add']">新增</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="sourceList">
      <el-table-column label="数据源ID" align="center" prop="id" />
      <el-table-column label="数据源名称" align="center" prop="name" />
      <el-table-column label="数据源类型" align="center" prop="type">
        <template #default="scope">
          <el-tag :type="scope.row.type === 'MYSQL' || scope.row.type === 'POSTGRESQL' ? 'success' : (scope.row.type === 'KAFKA' ? 'warning' : 'info')">{{ scope.row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="连接字符串/路径" align="center" prop="connectionStr" show-overflow-tooltip />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button type="primary" link icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['data-integration:source:edit']">修改</el-button>
          <el-button type="danger" link icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['data-integration:source:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改数据源对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="sourceRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="数据源名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="数据源类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择数据源类型" style="width: 100%">
            <el-option label="HTTP" value="HTTP" />
            <el-option label="MYSQL" value="MYSQL" />
            <el-option label="POSTGRESQL" value="POSTGRESQL" />
            <el-option label="KAFKA" value="KAFKA" />
            <el-option label="FILE" value="FILE" />
          </el-select>
        </el-form-item>
        <el-form-item label="连接字符串" prop="connectionStr">
          <el-input v-model="form.connectionStr" type="textarea" placeholder="如 JDBC URL, 文件路径, Kafka Broker 列表" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
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

<script setup name="DataSource">
import { ref, reactive, onMounted } from 'vue';
import { listSource, addSource, updateSource, delSource } from '@/api/data-integration/config';
import { ElMessage, ElMessageBox } from 'element-plus';

const sourceList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const title = ref('');

const data = reactive({
  form: {},
  rules: {
    name: [{ required: true, message: '数据源名称不能为空', trigger: 'blur' }],
    type: [{ required: true, message: '数据源类型不能为空', trigger: 'change' }]
  }
});

const { form, rules } = data;
const sourceRef = ref(null);

function getList() {
  loading.value = true;
  listSource().then(response => {
    sourceList.value = response.data;
    loading.value = false;
  });
}

function cancel() {
  open.value = false;
  reset();
}

function reset() {
  form.id = undefined;
  form.name = undefined;
  form.type = undefined;
  form.connectionStr = undefined;
  form.username = undefined;
  form.password = undefined;
  if (sourceRef.value) sourceRef.value.resetFields();
}

function handleAdd() {
  reset();
  open.value = true;
  title.value = '添加数据源';
}

function handleUpdate(row) {
  reset();
  form.id = row.id;
  form.name = row.name;
  form.type = row.type;
  form.connectionStr = row.connectionStr;
  form.username = row.username;
  form.password = row.password;
  open.value = true;
  title.value = '修改数据源';
}

function submitForm() {
  sourceRef.value.validate(valid => {
    if (valid) {
      if (form.id != null) {
        updateSource(form).then(response => {
          ElMessage.success('修改成功');
          open.value = false;
          getList();
        });
      } else {
        addSource(form).then(response => {
          ElMessage.success('新增成功');
          open.value = false;
          getList();
        });
      }
    }
  });
}

function handleDelete(row) {
  ElMessageBox.confirm('是否确认删除名称为"' + row.name + '"的数据源?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(function () {
    return delSource(row.id);
  }).then(() => {
    getList();
    ElMessage.success('删除成功');
  }).catch(() => {});
}

onMounted(() => {
  getList();
});
</script>
