<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="分区维度" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择维度" clearable style="width: 200px">
          <el-option label="行政营业" value="1" />
          <el-option label="DMA漏损" value="2" />
          <el-option label="控压高程" value="3" />
          <el-option label="供水调度" value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="分区名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入分区名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="分区状态" clearable style="width: 200px">
          <el-option
            v-for="dict in sys_normal_disable"
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
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['water-basic:zone:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="Sort"
          @click="toggleExpandAll"
        >展开/折叠</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Upload"
          @click="handleImport"
          v-hasPermi="['water-basic:zone:import']"
        >导入</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['water-basic:zone:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 树形表格 -->
    <ZoneTreeTable
      v-if="refreshTable"
      :data="zoneList"
      :loading="loading"
      :is-expand-all="isExpandAll"
      @add="handleAdd"
      @edit="handleUpdate"
      @delete="handleDelete"
    />

    <!-- 表单弹窗 -->
    <ZoneFormDialog
      ref="formDialogRef"
      :tree-data="zoneOptions"
      @success="getList"
    />

    <!-- 导入弹窗 -->
    <ZoneImportDialog
      ref="importDialogRef"
      :tree-data="zoneOptions"
      @success="getList"
    />
  </div>
</template>

<script setup name="Zone">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { listZoneTree, delZone } from '@/api/water-basic/zone'
import ZoneTreeTable from './components/ZoneTreeTable.vue'
import ZoneFormDialog from './components/ZoneFormDialog.vue'
import ZoneImportDialog from './components/ZoneImportDialog.vue'

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict("sys_normal_disable");

const zoneList = ref([]);
const zoneOptions = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const isExpandAll = ref(true);
const refreshTable = ref(true);

const data = reactive({
  queryParams: {
    type: '1',
    name: undefined,
    status: undefined
  }
});

const { queryParams } = toRefs(data);
const formDialogRef = ref(null);
const importDialogRef = ref(null);

/** 查询分区列表 */
function getList() {
  loading.value = true;
  listZoneTree(queryParams.value).then(response => {
    zoneList.value = proxy.handleTree(response.data || response, "id");
    zoneOptions.value = zoneList.value; // 用于下拉树选择
    loading.value = false;
  });
}

/** 搜索按钮操作 */
function handleQuery() {
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 新增按钮操作 */
function handleAdd(row) {
  formDialogRef.value.open(row ? row.id : null);
}

/** 展开/折叠操作 */
function toggleExpandAll() {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
  });
}

/** 修改按钮操作 */
function handleUpdate(row) {
  formDialogRef.value.open(null, row.id);
}

/** 删除按钮操作 */
function handleDelete(row) {
  proxy.$modal.confirm('是否确认删除名称为"' + row.name + '"的数据项?').then(function() {
    return delZone(row.id);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导入操作 */
function handleImport() {
  importDialogRef.value.open();
}

/** 导出操作 */
function handleExport() {
  proxy.download('/water-basic/zone/export', {
    ...queryParams.value
  }, `zone_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
