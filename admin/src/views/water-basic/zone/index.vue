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

    <!-- 核心：树形表格 -->
    <el-table
      v-if="refreshTable"
      v-loading="loading"
      :data="zoneList"
      row-key="id"
      :default-expand-all="isExpandAll"
      :tree-props="{children: 'children'}"
      class="flex-table"
    >
      <el-table-column prop="name" label="分区名称" min-width="260" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ scope.row.name }}</span>
          <el-tag v-if="scope.row.childCount > 0" size="small" type="success" effect="light" style="margin-left: 8px; border-radius: 10px;">
            {{ scope.row.childCount }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="分区编码" width="150"></el-table-column>
      <el-table-column prop="area" label="面积(k㎡)" width="120"></el-table-column>
      <el-table-column prop="population" label="服务人口" width="120"></el-table-column>
      <el-table-column prop="managerName" label="负责人" width="120"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" align="center" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="420" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="success" icon="Link" @click="handleBindDevice(scope.row)" v-hasPermi="['water-basic:zone:edit']">关联设备</el-button>
          <el-button link type="warning" icon="Link" @click="handleBindRevenue(scope.row)" v-hasPermi="['water-basic:zone:edit']">关联营收</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['water-basic:zone:edit']">修改</el-button>
          <el-button link type="primary" icon="Plus" @click="handleAdd(scope.row)" v-hasPermi="['water-basic:zone:add']">新增</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['water-basic:zone:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改分区对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="zoneRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24" v-if="form.parentId !== 0 && form.parentId !== '0'">
            <el-form-item label="上级分区" prop="parentId">
              <el-tree-select
                v-model="form.parentId"
                :data="zoneOptions"
                :props="{ value: 'code', label: 'name', children: 'children' }"
                value-key="code"
                placeholder="选择上级分区"
                check-strictly
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分区名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入分区名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分区编码" prop="code">
              <el-input v-model="form.code" placeholder="请输入分区编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="覆盖面积" prop="area">
              <el-input-number v-model="form.area" :min="0" :precision="2" controls-position="right" placeholder="面积(平方公里)" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务人口" prop="population">
              <el-input-number v-model="form.population" :min="0" controls-position="right" placeholder="服务人口数" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="managerName">
              <el-input v-model="form.managerName" placeholder="请输入负责人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="managerPhone">
              <el-input v-model="form.managerPhone" placeholder="请输入联系电话" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="位置描述" prop="address">
              <el-input v-model="form.address" placeholder="请输入位置描述" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="sort">
              <el-input-number v-model="form.sort" controls-position="right" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分区状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in sys_normal_disable"
                  :key="dict.value"
                  :label="dict.value"
                >{{ dict.label }}</el-radio>
              </el-radio-group>
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

    <!-- 分区导入对话框 -->
    <el-dialog :title="upload.title" v-model="upload.open" width="400px" append-to-body>
      <el-form :model="upload" label-width="80px">
        <el-form-item label="上级分区" prop="parentId">
          <el-tree-select
            v-model="upload.parentId"
            :data="zoneOptions"
            :props="{ value: 'code', label: 'name', children: 'children' }"
            value-key="code"
            placeholder="选择导入到哪个分区下(默认顶级)"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-upload
          ref="uploadRef"
          :limit="1"
          accept=".xlsx, .xls"
          :headers="upload.headers"
          :action="upload.url"
          :data="{ parentId: upload.parentId }"
          :disabled="upload.isUploading"
          :on-progress="handleFileUploadProgress"
          :on-success="handleFileSuccess"
          :on-error="handleFileError"
          :auto-upload="false"
          drag
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip text-center">
              <span>仅允许导入xls、xlsx格式文件。</span>
              <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importTemplate">下载模板</el-link>
            </div>
          </template>
        </el-upload>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFileForm">确 定</el-button>
          <el-button @click="upload.open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 关联设备抽屉 -->
    <ZoneBindDevice
      v-model="bindDeviceVisible"
      :zone-code="currentZoneCode"
      :zone-name="currentZoneName"
      @success="getList"
    />

    <!-- 关联营收抽屉 -->
    <ZoneBindRevenue
      v-model="bindRevenueVisible"
      :zone-code="currentZoneCode"
      :zone-name="currentZoneName"
      @success="getList"
    />
  </div>
</template>

<script setup name="Zone">
import { ref, reactive, toRefs, onMounted, nextTick, getCurrentInstance } from 'vue'
import { listZoneTree, getZone, addZone, updateZone, delZone } from '@/api/water-basic/zone'
import { getToken } from "@/utils/auth"
import ZoneBindDevice from './components/ZoneBindDevice.vue'
import ZoneBindRevenue from './components/ZoneBindRevenue.vue'

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict("sys_normal_disable");

const zoneList = ref([]);
const zoneOptions = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const isExpandAll = ref(true);
const refreshTable = ref(true);
const open = ref(false);
const title = ref("");

// 关联相关状态
const bindDeviceVisible = ref(false);
const bindRevenueVisible = ref(false);
const currentZoneCode = ref("");
const currentZoneName = ref("");

const data = reactive({
  form: {},
  queryParams: {
    type: '1',
    name: undefined,
    status: undefined
  },
  rules: {
    name: [{ required: true, message: "分区名称不能为空", trigger: "blur" }],
    sort: [{ required: true, message: "显示排序不能为空", trigger: "blur" }]
  }
});

const { queryParams, form, rules } = toRefs(data);

// 递归清理后端树数据中附带的 hasChildren 属性，防止它干扰 el-table 的本地展开逻辑
function cleanHasChildren(list) {
  if (!list || !list.length) return [];
  return list.map(item => {
    delete item.hasChildren; // 核心修复点：删除此字段
    if (item.children && item.children.length > 0) {
      item.children = cleanHasChildren(item.children);
    } else {
      // 保证 children 至少为 undefined 而非空数组，防止渲染出空箭头
      item.children = undefined;
    }
    return item;
  });
}

/** 查询分区列表 */
function getList() {
  loading.value = true;
  listZoneTree(queryParams.value).then(response => {
    const rawData = response.data || response;
    // 数据清洗，移除 hasChildren 伪属性
    const cleanData = cleanHasChildren(rawData);
    
    zoneList.value = cleanData;
    zoneOptions.value = cleanData;
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

/** 展开/折叠操作 */
function toggleExpandAll() {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
  });
}

/** 表单重置 */
function reset() {
  form.value = {
    id: undefined,
    parentId: 0,
    name: undefined,
    code: undefined,
    area: 0,
    population: 0,
    managerName: undefined,
    managerPhone: undefined,
    address: undefined,
    sort: 0,
    status: "0"
  };
  proxy.resetForm("zoneRef");
}

/** 新增按钮操作 */
function handleAdd(row) {
  reset();
  if (row != null && row.code) {
    form.value.parentId = row.code;
  }
  open.value = true;
  title.value = "添加分区";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  getZone(row.id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改分区";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["zoneRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateZone(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addZone(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
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

/** 打开关联设备抽屉 */
function handleBindDevice(row) {
  currentZoneCode.value = row.code;
  currentZoneName.value = row.name;
  bindDeviceVisible.value = true;
}

/** 打开关联营收抽屉 */
function handleBindRevenue(row) {
  currentZoneCode.value = row.code;
  currentZoneName.value = row.name;
  bindRevenueVisible.value = true;
}

/** 导出操作 */
function handleExport() {
  proxy.download('/water-basic/zone/export', {
    ...queryParams.value
  }, `zone_${new Date().getTime()}.xlsx`)
}

/*** 导入操作参数 ***/
const upload = reactive({
  open: false,
  title: "分区数据导入",
  isUploading: false,
  parentId: undefined,
  headers: { Authorization: "Bearer " + getToken() },
  url: import.meta.env.VITE_APP_BASE_API + "/water-basic/zone/importData"
});

/** 导入按钮操作 */
function handleImport() {
  upload.open = true;
  upload.parentId = undefined;
  if (proxy.$refs["uploadRef"]) {
    proxy.$refs["uploadRef"].clearFiles();
  }
}

/** 下载模板操作 */
function importTemplate() {
  proxy.download("/water-basic/zone/importTemplate", {}, `zone_template_${new Date().getTime()}.xlsx`);
}

/** 文件上传中处理 */
const handleFileUploadProgress = (event, file, fileList) => {
  upload.isUploading = true;
};

/** 文件上传成功处理 */
const handleFileSuccess = (response, file, fileList) => {
  upload.isUploading = false;
  proxy.$refs["uploadRef"].clearFiles();
  upload.open = false;
  if (response.code === 200) {
    proxy.$modal.msgSuccess("导入成功");
    getList();
  } else {
    proxy.$modal.msgError(response.msg || "导入失败");
  }
};

/** 文件上传失败处理 */
const handleFileError = () => {
  upload.isUploading = false;
  proxy.$modal.msgError("导入失败，请检查网络或服务是否正常");
};

/** 提交上传文件 */
function submitFileForm() {
  proxy.$refs["uploadRef"].submit();
}

onMounted(() => {
  getList();
});
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  padding: 20px;
}

.flex-table {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.flex-table :deep(.el-table__inner-wrapper) {
  height: 100% !important;
}

.flex-table :deep(.el-table__expand-icon) {
  font-size: 14px;
}
</style>
