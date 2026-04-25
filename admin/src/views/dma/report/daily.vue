<template>
  <div class="app-container">
    <el-card class="box-card mb8">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="选择日期">
          <el-date-picker
            v-model="queryParams.date"
            type="date"
            placeholder="选择报表日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :clearable="false"
            @change="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button type="success" icon="DataLine" @click="handleTriggerAgg" :loading="triggering">触发重新计算</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="24" class="mb8">
        <el-card shadow="hover" header="分区产销差日报表 (层级视图)">
          <el-table
            v-loading="loading"
            :data="reportList"
            row-key="id"
            border
            default-expand-all
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          >
            <el-table-column prop="name" label="分区名称" width="220" fixed="left" />
            <el-table-column prop="code" label="分区编码" width="150" />
            <el-table-column label="总供水量 (m³)" align="right">
              <template #default="scope">
                <span class="text-primary font-bold">{{ scope.row.supply || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="总售水量 (m³)" align="right">
              <template #default="scope">
                <span class="text-success font-bold">{{ scope.row.sales || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="产销差水量 (m³)" align="right">
              <template #default="scope">
                <span class="text-warning">{{ scope.row.nrwDiff || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="产销差率 (%)" align="right">
              <template #default="scope">
                <el-tag :type="getNrwRatioTag(scope.row.nrwRatio)">{{ scope.row.nrwRatio || '0.00' }}%</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="DmaDailyReport">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

// 假设我们直接请求后端一个专门组装好树形报表数据的接口
// 但目前后端只提供了 /report/nrw-trend (单分区趋势)，和 /water-basic/zone/tree (分区树)
// 我们需要在前端组装，或者假设后端提供了 /report/zone-tree-summary
// 为了完整展示，这里我们模拟通过请求 zone tree 并循环附加上数据的过程，或者假定有一个聚合接口

const loading = ref(false)
const triggering = ref(false)
const reportList = ref([])

const queryParams = reactive({
  date: new Date(Date.now() - 86400000).toISOString().split('T')[0] // 默认昨天
})

// 我们这里假定后端添加了一个接口或者前端通过多次请求合并
// 为了简化和不改变后端，前端先通过树形结构并调用趋势接口合并 (生产环境建议后端出个专用接口)
function getList() {
  loading.value = true
  // 先获取分区树
  request({ url: '/water-basic/zone/tree', method: 'get' }).then(res => {
    const tree = res.data || []
    
    // 递归遍历树获取每个节点的当天数据
    const promises = []
    
    const traverse = (nodes) => {
      nodes.forEach(node => {
        const p = request({
          url: '/report/nrw-trend',
          method: 'get',
          params: { zoneCode: node.code, startDate: queryParams.date, endDate: queryParams.date, type: '1d' }
        }).then(dataRes => {
          const reportData = dataRes.data && dataRes.data.length > 0 ? dataRes.data[0] : {}
          node.supply = reportData.supply || 0
          node.sales = reportData.sales || 0
          node.nrwDiff = reportData.nrw_diff || 0
          node.nrwRatio = reportData.nrw_ratio || 0
        }).catch(() => {
          node.supply = 0; node.sales = 0; node.nrwDiff = 0; node.nrwRatio = 0;
        })
        promises.push(p)
        
        if (node.children && node.children.length > 0) {
          traverse(node.children)
        }
      })
    }
    
    traverse(tree)
    
    Promise.all(promises).then(() => {
      reportList.value = tree
      loading.value = false
    })
  }).catch(() => { loading.value = false })
}

function handleQuery() {
  getList()
}

function resetQuery() {
  queryParams.date = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  handleQuery()
}

function handleTriggerAgg() {
  triggering.value = true
  request({
    url: '/report/trigger-agg',
    method: 'get',
    params: { date: queryParams.date, type: '1d' }
  }).then(res => {
    ElMessage.success('触发重新计算成功')
    setTimeout(() => {
      getList()
      triggering.value = false
    }, 2000)
  }).catch(() => {
    triggering.value = false
  })
}

function getNrwRatioTag(ratio) {
  if (ratio <= 10) return 'success'
  if (ratio <= 20) return 'warning'
  return 'danger'
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.text-primary { color: #409EFF; }
.text-success { color: #67C23A; }
.text-warning { color: #E6A23C; }
.font-bold { font-weight: bold; }
</style>
