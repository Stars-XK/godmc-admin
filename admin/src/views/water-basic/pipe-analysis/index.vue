<template>
  <div class="pipe-analysis">
    <!-- 概要统计 -->
    <div class="summary-row">
      <div class="sum-card"><span class="sum-label">管线总数</span><span class="sum-val">{{ stats.totalCount }} <small>条</small></span></div>
      <div class="sum-card"><span class="sum-label">管网总长</span><span class="sum-val">{{ stats.totalLength }} <small>m</small></span></div>
      <div class="sum-card"><span class="sum-label">平均管径</span><span class="sum-val">{{ stats.avgDiameter }} <small>mm</small></span></div>
    </div>

    <el-row :gutter="20">
      <!-- 管径分布 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="p-card">
          <template #header><div class="card-title"><el-icon><Histogram /></el-icon><span>管径分布</span></div></template>
          <div ref="diameterRef" class="chart-md"></div>
        </el-card>
      </el-col>

      <!-- 管线类型 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="p-card">
          <template #header><div class="card-title"><el-icon><PieChart /></el-icon><span>管线类型分布</span></div></template>
          <div ref="typeRef" class="chart-md"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top:20px">
      <!-- 管材分布 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="p-card">
          <template #header><div class="card-title"><el-icon><PieChart /></el-icon><span>管材分布</span></div></template>
          <div ref="materialRef" class="chart-md"></div>
        </el-card>
      </el-col>

      <!-- 管径分段详情 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="p-card">
          <template #header><div class="card-title"><el-icon><List /></el-icon><span>管径分段统计</span></div></template>
          <el-table :data="stats.diameterRanges || []" size="small" stripe>
            <el-table-column prop="label" label="管径范围" width="130" />
            <el-table-column prop="count" label="数量(条)" width="90" />
            <el-table-column prop="length" label="总长度(m)">
              <template #default="{ row }">{{ Number(row.length).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="占比" width="80">
              <template #default="{ row }">
                {{ stats.totalCount > 0 ? ((row.count / stats.totalCount) * 100).toFixed(1) : '0' }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Histogram, PieChart, List } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

const stats = ref({ totalCount: 0, totalLength: '0', avgDiameter: '0', byType: [], byMaterial: [], diameterRanges: [] })

const diameterRef = ref(null)
const typeRef = ref(null)
const materialRef = ref(null)

let diameterChart, typeChart, materialChart

function fetchStats() {
  request({ url: '/water-basic/pipe-analysis/stats', method: 'get' }).then(res => {
    if (res.data) {
      stats.value = res.data
      nextTick(() => {
        renderDiameter()
        renderType()
        renderMaterial()
      })
    }
  })
}

function renderDiameter() {
  if (!diameterRef.value) return
  if (!diameterChart) diameterChart = echarts.init(diameterRef.value)
  const data = (stats.value.diameterRanges || [])
  diameterChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 10, bottom: 30 },
    xAxis: { type: 'category', data: data.map(d => d.label), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', name: '条' },
    series: [{
      type: 'bar', data: data.map(d => d.count),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#0D9488' }, { offset: 1, color: '#99F6E4' },
        ]),
        borderRadius: [4, 4, 0, 0],
      },
      barWidth: '50%',
    }],
  }, true)
}

function renderType() {
  if (!typeRef.value) return
  if (!typeChart) typeChart = echarts.init(typeRef.value)
  const data = (stats.value.byType || []).map(d => ({ name: d.label, value: d.count }))
  const colors = ['#0D9488', '#2563EB', '#D97706', '#9333EA']
  typeChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
      data: data.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } })),
      label: { fontSize: 11 },
    }],
  }, true)
}

function renderMaterial() {
  if (!materialRef.value) return
  if (!materialChart) materialChart = echarts.init(materialRef.value)
  const data = (stats.value.byMaterial || []).map(d => ({ name: d.material, value: d.count }))
  const colors = ['#2563EB', '#0D9488', '#D97706', '#DC2626', '#9333EA', '#10B981', '#F59E0B', '#6366F1']
  materialChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
      data: data.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } })),
      label: { fontSize: 11 },
    }],
  }, true)
}

onMounted(() => { fetchStats() })
</script>

<style lang="scss" scoped>
.pipe-analysis { padding: 20px 24px; }

.summary-row {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;
}

.sum-card {
  background: #FFF; border-radius: 10px; padding: 18px 24px; border: 1px solid #E2E8F0;
  display: flex; justify-content: space-between; align-items: center;
}
.sum-label { font-size: 14px; color: #64748B; }
.sum-val { font-size: 28px; font-weight: 700; color: #0F172A; }
.sum-val small { font-size: 14px; font-weight: 400; color: #94A3B8; }

.p-card { border-radius: 10px; border: 1px solid #E2E8F0; box-shadow: none; }

.card-title {
  display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #0F172A;
  .el-icon { color: #0D9488; }
}

.chart-md { width: 100%; height: 300px; }
</style>
