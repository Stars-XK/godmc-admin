<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="问题状态" prop="issueStatus">
        <el-select v-model="queryParams.issueStatus" placeholder="请选择状态" clearable>
          <el-option label="待处理" value="open" />
          <el-option label="已确认" value="acknowledged" />
          <el-option label="处理中" value="in_progress" />
          <el-option label="已解决" value="resolved" />
          <el-option label="已关闭" value="closed" />
          <el-option label="已验证" value="verified" />
        </el-select>
      </el-form-item>
      <el-form-item label="严重程度" prop="severity">
        <el-select v-model="queryParams.severity" placeholder="请选择" clearable>
          <el-option label="严重" value="1" />
          <el-option label="重要" value="2" />
          <el-option label="一般" value="3" />
          <el-option label="观察" value="4" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="issueList">
      <el-table-column label="问题编号" align="center" prop="issueCode" width="160" />
      <el-table-column label="问题标题" align="center" prop="issueTitle" show-overflow-tooltip />
      <el-table-column label="严重程度" align="center" prop="severity">
        <template #default="scope">
          <el-tag :type="severityTag(scope.row.severity)">{{ severityMap[scope.row.severity] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="issueStatus">
        <template #default="scope">
          <el-tag :type="statusTag(scope.row.issueStatus)">{{ statusMap[scope.row.issueStatus] || scope.row.issueStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="上报人" align="center" prop="reporterName" />
      <el-table-column label="处理人" align="center" prop="assigneeName" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope"><span>{{ parseTime(scope.row.createTime) }}</span></template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance } from 'vue'
import { listIssue } from '@/api/inspection/issue'

const { proxy } = getCurrentInstance()
const severityMap = { 1: '严重', 2: '重要', 3: '一般', 4: '观察' }
const severityTag = (s) => ({ 1: 'danger', 2: 'warning', 3: 'primary', 4: 'info' }[s] || 'info')
const statusMap = { open: '待处理', acknowledged: '已确认', in_progress: '处理中', resolved: '已解决', closed: '已关闭', verified: '已验证' }
const statusTag = (s) => ({ open: 'danger', acknowledged: 'warning', in_progress: 'primary', resolved: 'success', closed: 'info', verified: 'success' }[s] || 'info')

const issueList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10, issueStatus: undefined, severity: undefined })

function getList() {
  loading.value = true
  listIssue(queryParams).then(res => { issueList.value = res.data.list; total.value = res.data.total; loading.value = false })
}
function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }

getList()
</script>
