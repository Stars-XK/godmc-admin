<template>
  <div class="app-container">
    <el-card class="box-card mb8">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="选择月份">
          <el-date-picker
            v-model="queryParams.date"
            type="month"
            placeholder="选择报表月份"
            format="YYYY-MM"
            value-format="YYYY-MM"
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
        <el-card shadow="hover" header="分区产销差月报表 (层级视图)">
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

<script setup name="DmaMonthlyReport">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const triggering = ref(false)
const reportList = ref([])

const queryParams = reactive({
  date: new Date().toISOString().substring(0, 7) // 当前月
})

function getList() {
  loading.value = true
  request({ url: '/water-basic/zone/tree', method: 'get' }).then(res => {
    const tree = res.data || []
    
    // 我们需要把 YYYY-MM 转为 startDate 和 endDate 传给现有的趋势接口
    const year = parseInt(queryParams.date.split('-')[0])
    const month = parseInt(queryParams.date.split('-')[1])
    const startDate = `${queryParams.date}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0] // 当月最后一天

    const promises = []
    
    const traverse = (nodes) => {
      nodes.forEach(node => {
        // 请求该月所有日期的产销差，然后汇总
        const p = request({
          url: '/report/nrw-trend',
          method: 'get',
          params: { zoneCode: node.code, startDate: startDate, endDate: endDate, type: '1mo' }
        }).then(dataRes => {
          // 由于 1mo 传参的话，后端其实返回的是月粒度，也就是只会返回一条 date = YYYY-MM 的数据
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
  queryParams.date = new Date().toISOString().substring(0, 7)
  handleQuery()
}

function handleTriggerAgg() {
  triggering.value = true
  request({
    url: '/report/trigger-agg',
    method: 'get',
    params: { date: queryParams.date, type: '1mo' }
  }).then(res => {
    ElMessage.success('触发月度重新计算成功')
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
