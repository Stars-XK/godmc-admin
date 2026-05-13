<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
         <el-form-item label="岗位编码" prop="postCode">
            <el-input
               v-model="queryParams.postCode"
               placeholder="请输入岗位编码"
               clearable
               style="width: 200px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="岗位名称" prop="postName">
            <el-input
               v-model="queryParams.postName"
               placeholder="请输入岗位名称"
               clearable
               style="width: 200px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="岗位状态" clearable style="width: 200px">
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
               v-hasPermi="['system:post:add']"
            >新增</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="success"
               plain
               icon="Edit"
               :disabled="single"
               @click="handleUpdate"
               v-hasPermi="['system:post:edit']"
            >修改</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="danger"
               plain
               icon="Delete"
               :disabled="multiple"
               @click="handleDelete"
               v-hasPermi="['system:post:remove']"
            >删除</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="warning"
               plain
               icon="Download"
               @click="handleExport"
               v-hasPermi="['system:post:export']"
            >导出</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="postList" @selection-change="handleSelectionChange">
         <el-table-column type="selection" width="55" align="center" />
         <el-table-column label="岗位编号" align="center" prop="postId" />
         <el-table-column label="岗位编码" align="center" prop="postCode" />
         <el-table-column label="岗位名称" align="center" prop="postName" />
         <el-table-column label="岗位排序" align="center" prop="postSort" />
         <el-table-column label="状态" align="center" prop="status">
            <template #default="scope">
               <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
            </template>
         </el-table-column>
         <el-table-column label="创建时间" align="center" prop="createTime" width="180">
            <template #default="scope">
               <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:post:edit']">修改</el-button>
               <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:post:remove']">删除</el-button>
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

      <!-- 添加或修改岗位对话框 -->
      <el-dialog :title="title" v-model="open" width="650px" append-to-body class="sys-dialog" top="5vh" destroy-on-close>
         <el-form ref="postRef" :model="form" :rules="rules" label-width="80px">
            <div class="dialog-scroll">
               <div class="form-card">
                  <div class="card-header">
                     <span class="card-dot"></span>
                     <el-icon class="card-icon"><Document /></el-icon>
                     <span class="card-title">基本信息</span>
                  </div>
                  <div class="card-body">
                     <el-row :gutter="20">
                        <el-col :span="24">
                           <el-form-item label="岗位名称" prop="postName">
                              <el-input v-model="form.postName" placeholder="请输入岗位名称" />
                           </el-form-item>
                        </el-col>
                     </el-row>
                     <el-row :gutter="20">
                        <el-col :span="12">
                           <el-form-item label="岗位编码" prop="postCode">
                              <el-input v-model="form.postCode" placeholder="请输入编码名称" />
                           </el-form-item>
                        </el-col>
                        <el-col :span="12">
                           <el-form-item label="岗位顺序" prop="postSort">
                              <el-input-number v-model="form.postSort" controls-position="right" :min="0" />
                           </el-form-item>
                        </el-col>
                     </el-row>
                  </div>
               </div>
               <div class="form-card">
                  <div class="card-header">
                     <span class="card-dot dot-green"></span>
                     <el-icon class="card-icon"><Setting /></el-icon>
                     <span class="card-title">其他设置</span>
                  </div>
                  <div class="card-body">
                     <el-row :gutter="20">
                        <el-col :span="12">
                           <el-form-item label="岗位状态" prop="status">
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
                     <el-row :gutter="20">
                        <el-col :span="24">
                           <el-form-item label="备注" prop="remark">
                              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
                           </el-form-item>
                        </el-col>
                     </el-row>
                  </div>
               </div>
            </div>
         </el-form>
         <template #footer>
            <div class="dialog-footer">
               <el-button @click="cancel">取 消</el-button>
               <el-button type="primary" @click="submitForm">确 定</el-button>
            </div>
         </template>
      </el-dialog>
   </div>
</template>

<script setup name="Post">
import { listPost, addPost, delPost, getPost, updatePost } from "@/api/system/post";
import { Document, Setting } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict("sys_normal_disable");

const postList = ref([]);
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
    postCode: undefined,
    postName: undefined,
    status: undefined
  },
  rules: {
    postName: [{ required: true, message: "岗位名称不能为空", trigger: "blur" }],
    postCode: [{ required: true, message: "岗位编码不能为空", trigger: "blur" }],
    postSort: [{ required: true, message: "岗位顺序不能为空", trigger: "blur" }],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询岗位列表 */
function getList() {
  loading.value = true;
  listPost(queryParams.value).then(response => {
    postList.value = response.data.list;
    total.value = response.data.total;
    loading.value = false;
  });
}
/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}
/** 表单重置 */
function reset() {
  form.value = {
    postId: undefined,
    postCode: undefined,
    postName: undefined,
    postSort: 0,
    status: "0",
    remark: undefined
  };
  proxy.resetForm("postRef");
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
/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.postId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加岗位";
}
/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const postId = row.postId || ids.value;
  getPost(postId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改岗位";
  });
}
/** 提交按钮 */
function submitForm() {
  proxy.$refs["postRef"].validate(valid => {
    if (valid) {
      if (form.value.postId != undefined) {
        updatePost(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addPost(form.value).then(response => {
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
  const postIds = row.postId || ids.value;
  proxy.$modal.confirm('是否确认删除岗位编号为"' + postIds + '"的数据项？').then(function() {
    return delPost(postIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}
/** 导出按钮操作 */
function handleExport() {
  proxy.download("system/post/export", {
    ...queryParams.value
  }, `post_${new Date().getTime()}.xlsx`);
}

getList();
</script>

<style scoped>
/* ===== 卡片式表单对话框 ===== */
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
.card-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  flex-shrink: 0;
}
.card-dot.dot-purple { background: #8b5cf6; }
.card-dot.dot-green  { background: #10b981; }

.card-icon { font-size: 16px; color: #64748b; }
.card-title { font-size: 14px; font-weight: 600; color: #334155; }
.card-body { padding: 18px 20px; }
</style>
