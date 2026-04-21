<template>
  <el-drawer
    :title="`关联营收基础用户 - ${zoneName}`"
    v-model="visible"
    direction="rtl"
    size="1200px"
    @close="handleClose"
    append-to-body
    class="custom-drawer"
  >
    <div class="manual-container">
      <div class="filter-bar">
        <el-form :model="queryParams" ref="queryRef" :inline="true">
          <el-form-item label="用户编号" prop="userNo">
            <el-input v-model="queryParams.userNo" placeholder="请输入编号" clearable style="width: 150px" @keyup.enter="getList" />
          </el-form-item>
          <el-form-item label="用户名称" prop="name">
            <el-input v-model="queryParams.name" placeholder="请输入名称" clearable style="width: 150px" @keyup.enter="getList" />
          </el-form-item>
          <el-form-item label="用户分类" prop="userCategory">
            <el-select v-model="queryParams.userCategory" placeholder="请选择用户分类" clearable style="width: 150px" @change="getList">
              <el-option
                v-for="dict in water_user_category"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          </el-form-item>
        </el-form>
        <div class="action-btn">
          <el-button type="primary" size="default" :disabled="!selectedIds.length" @click="submitManualBind">
            <el-icon style="margin-right: 4px"><Link /></el-icon>
            确认绑定 ({{ selectedIds.length }})
          </el-button>
        </div>
      </div>
      
      <el-alert title="列表中仅显示当前未关联任何分区的独立营收用户" type="info" show-icon style="margin-bottom: 15px; border-radius: 8px;" />

      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="userList"
          @selection-change="handleSelectionChange"
          height="100%"
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="用户编号" prop="userNo" width="150" />
          <el-table-column label="用户名称" prop="userName" show-overflow-tooltip />
          <el-table-column label="用户分类" prop="userCategory" width="180">
            <template #default="scope">
              <dict-tag :options="water_user_category" :value="scope.row.userCategory" />
            </template>
          </el-table-column>
          <el-table-column label="手机号" prop="phone" width="120" />
          <el-table-column label="详细地址" prop="address" show-overflow-tooltip />
        </el-table>
      </div>

      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="pageNum"
        v-model:limit="pageSize"
        :page-sizes="pageSizes"
        @pagination="getList"
      />
    </div>

    <!-- 进度覆盖层 -->
    <div v-if="isUploading" class="progress-overlay">
      <div class="progress-card">
        <div class="pulse-ring"></div>
        <el-icon class="loading-icon is-loading"><Loading /></el-icon>
        <h3 class="progress-title">营收用户关联处理中</h3>
        <p class="progress-desc">正在处理，请勿刷新页面...</p>
        <el-progress :percentage="progress" :stroke-width="12" striped striped-flow class="modern-progress"></el-progress>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, watch, getCurrentInstance } from 'vue'
import { getUnboundRevenueList, bindRevenueUsers } from '@/api/water-basic/zone-bind'

const props = defineProps({
  modelValue: Boolean,
  zoneCode: String,
  zoneName: String
})

const emit = defineEmits(['update:modelValue', 'success'])
const { proxy } = getCurrentInstance()
const { water_user_category } = proxy.useDict('water_user_category')

const visible = ref(false)
const activeTab = ref('manual')
const loading = ref(false)
const userList = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const pageSizes = [20, 50, 100, 200, 500]
const selectedIds = ref([])
const queryParams = ref({ name: undefined, userNo: undefined, userCategory: undefined })

const isUploading = ref(false)
const progress = ref(0)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    pageNum.value = 1
    pageSize.value = 20
    selectedIds.value = []
    getList()
  }
})

function handleClose() {
  emit('update:modelValue', false)
  userList.value = []
  queryParams.value = { name: undefined, userNo: undefined, userCategory: undefined }
}

function handleQuery() {
  pageNum.value = 1
  getList()
}

async function getList() {
  loading.value = true
  try {
    const res = await getUnboundRevenueList({
      ...queryParams.value,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    const data = res.data || {}
    userList.value = data.list || []
    total.value = data.total || 0
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(item => item.id)
}

function submitManualBind() {
  bindRevenueUsers({ zoneCode: props.zoneCode, userIds: selectedIds.value }).then(() => {
    proxy.$modal.msgSuccess('手动绑定成功')
    emit('success')
    getList() // 重新刷新列表，已绑定的会消失
  })
}
</script>

<style scoped>
/* 搜索和操作组合栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #f8f9fa;
  padding: 16px 16px 0 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
}

.action-btn .el-button {
  height: 32px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
  transition: all 0.3s;
}
.action-btn .el-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.manual-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.table-wrapper {
  flex: 1;
  min-height: 0; /* 必须加这个，防止 flex 子项溢出 */
  margin-bottom: 10px;
}
.bind-tabs {
  padding: 0 20px;
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}
.bind-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
}
.bind-tabs :deep(.el-tab-pane) {
  height: 100%;
}
.upload-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  margin-top: 10px;
}
.upload-zone {
  width: 100%;
  max-width: 500px;
  border: 2px dashed #dcdfe6;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}
.upload-zone:hover {
  border-color: #409EFF;
  background-color: #f0f7ff;
  transform: translateY(-2px);
}
.upload-icon {
  font-size: 54px;
  color: #a8abb2;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}
.upload-zone:hover .upload-icon {
  color: #409EFF;
  transform: scale(1.1);
}
.hidden-input {
  display: none;
}
/* 进度条样式复用 */
.progress-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  z-index: 3000;
  display: flex; justify-content: center; align-items: center;
}
.progress-card {
  width: 400px; background: #fff; border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); padding: 40px; text-align: center;
}
.loading-icon { font-size: 56px; color: #409EFF; margin-bottom: 20px; }
.progress-title { font-size: 20px; font-weight: 600; margin: 0 0 10px; }
.progress-desc { font-size: 14px; color: #909399; margin: 0 0 30px; }
</style>
