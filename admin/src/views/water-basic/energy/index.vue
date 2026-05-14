<template>
  <div class="energy-page">
    <!-- 汇总卡片 -->
    <div class="summary-row">
      <div class="sum-card"><span class="sum-label">总耗电量</span><span class="sum-val">{{ summary.totalPower }} <small>kWh</small></span></div>
      <div class="sum-card"><span class="sum-label">总供水量</span><span class="sum-val">{{ summary.totalWater }} <small>m³</small></span></div>
      <div class="sum-card"><span class="sum-label">平均单耗</span><span class="sum-val">{{ summary.avgUnitConsumption }} <small>kWh/m³</small></span></div>
      <div class="sum-card"><span class="sum-label">统计站点</span><span class="sum-val">{{ summary.stationCount }} <small>座</small></span></div>
    </div>

    <el-row :gutter="20">
      <!-- 站点能耗明细 -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="never" class="e-card">
          <template #header>
            <div class="card-title">
              <el-icon><TrendCharts /></el-icon><span>站点能耗明细</span>
              <el-date-picker v-model="summaryPeriod" type="month" value-format="YYYY-MM" placeholder="选择月份"
                size="small" style="margin-left:12px;width:150px" @change="fetchSummary" />
            </div>
          </template>
          <el-table :data="summary.details || []" size="small" stripe v-loading="loading">
            <el-table-column prop="stationName" label="站点名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="totalPower" label="耗电量(kWh)" width="130" sortable />
            <el-table-column prop="totalWater" label="供水量(m³)" width="130" sortable />
            <el-table-column prop="unitConsumption" label="单耗(kWh/m³)" width="130" sortable>
              <template #default="{ row }">
                <span :class="Number(row.unitConsumption) > 0.5 ? 'bad' : 'good'">{{ row.unitConsumption }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="days" label="统计天数" width="90" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 趋势图 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="e-card">
          <template #header><div class="card-title"><el-icon><PieChart /></el-icon><span>能耗分布</span></div></template>
          <div ref="pieRef" class="chart-sm"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { TrendCharts, PieChart } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import request from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const summaryPeriod = ref(dayjs().format('YYYY-MM'))
const summary = ref({ totalPower: '0', totalWater: '0', avgUnitConsumption: '0', stationCount: 0, details: [] })

const pieRef = ref(null)
let pieChart = null

function fetchSummary() {
  loading.value = true
  request({ url: '/water-basic/energy/summary', method: 'get', params: { period: summaryPeriod.value } })
    .then(res => {
      if (res.data) {
        summary.value = res.data
        nextTick(() => renderPie())
      }
    })
    .finally(() => { loading.value = false })
}

function renderPie() {
  if (!pieRef.value) return
  if (!pieChart) pieChart = echarts.init(pieRef.value)
  const details = summary.value.details || []
  const data = details.map(d => ({ name: d.stationName, value: Number(d.totalPower) }))
  const colors = ['#0D9488', '#2563EB', '#D97706', '#9333EA', '#DC2626', '#10B981', '#F59E0B', '#6366F1']
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} kWh ({d}%)' },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['50%', '50%'],
      data: data.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } })),
      label: { fontSize: 10, formatter: '{b}\n{d}%' },
    }],
  }, true)
}

onMounted(() => { fetchSummary() })
</script>

<style lang="scss" scoped>
.energy-page { padding: 20px 24px; }

.summary-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px;
}
.sum-card {
  background: #FFF; border-radius: 10px; padding: 18px 20px; border: 1px solid #E2E8F0;
  display: flex; justify-content: space-between; align-items: center;
}
.sum-label { font-size: 13px; color: #64748B; }
.sum-val { font-size: 24px; font-weight: 700; color: #0F172A; }
.sum-val small { font-size: 13px; font-weight: 400; color: #94A3B8; }

.e-card { border-radius: 10px; border: 1px solid #E2E8F0; box-shadow: none; margin-bottom: 0; }

.card-title {
  display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #0F172A;
  .el-icon { color: #0D9488; }
}

.chart-sm { width: 100%; height: 340px; }

.good { color: #10B981; font-weight: 600; }
.bad { color: #EF4444; font-weight: 600; }

@media (max-width: 992px) {
  .summary-row { grid-template-columns: repeat(2, 1fr); }
}
</style>
