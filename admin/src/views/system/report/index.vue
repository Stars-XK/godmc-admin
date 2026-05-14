<template>
  <div class="report-center">
    <!-- 报告类型卡片 -->
    <div class="type-cards">
      <div class="type-card" v-for="t in reportTypes" :key="t.value" @click="openGenerate(t)"
        :style="{ borderTop: `3px solid ${t.color}` }">
        <div class="type-icon" :style="{ background: t.bg }">
          <el-icon :size="24" :color="t.color"><component :is="t.icon" /></el-icon>
        </div>
        <span class="type-name">{{ t.label }}</span>
        <span class="type-desc">{{ t.desc }}</span>
      </div>
    </div>

    <!-- 搜索 + 工具栏 -->
    <el-card shadow="never" class="list-card">
      <div class="toolbar">
        <el-select v-model="filterType" placeholder="报告类型" clearable style="width:160px" @change="fetchList">
          <el-option v-for="t in reportTypes" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <el-input v-model="keyword" placeholder="搜索标题/标签" clearable style="width:220px" @keyup.enter="fetchList" @clear="fetchList">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="fetchList"><el-icon><Search /></el-icon>查询</el-button>
      </div>

      <el-table :data="tableData" stripe v-loading="loading" size="small">
        <el-table-column prop="title" label="报告标题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="viewReport(row)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="reportType" label="类型" width="110">
          <template #default="{ row }">{{ typeLabel(row.reportType) }}</template>
        </el-table-column>
        <el-table-column prop="reportPeriod" label="周期" width="100" />
        <el-table-column prop="reportStatus" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.reportStatus === 'published' ? 'success' : 'info'" size="small">
              {{ row.reportStatus === 'published' ? '已发布' : row.reportStatus === 'draft' ? '草稿' : '归档' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="summary" label="摘要" min-width="160" show-overflow-tooltip />
        <el-table-column prop="viewCount" label="浏览" width="70" align="center" />
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewReport(row)">查看</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination background layout="total, prev, pager, next" :total="total" v-model:current-page="pageNum"
          :page-size="pageSize" @current-change="fetchList" />
      </div>
    </el-card>

    <!-- 生成报告弹窗 -->
    <el-dialog v-model="genVisible" title="生成专题报告" width="480px" :close-on-click-modal="false">
      <el-form :model="genForm" label-width="90px">
        <el-form-item label="报告类型">
          <span>{{ typeLabel(genForm.reportType) }}</span>
        </el-form-item>
        <el-form-item label="报告周期" required>
          <el-date-picker v-model="genForm.periodDate" type="month" value-format="YYYY-MM" placeholder="选择月份"
            v-if="genForm.reportType !== 'device_ops'" />
          <span v-else>全量统计（不限定周期）</span>
        </el-form-item>
        <el-form-item label="报告标题">
          <el-input v-model="genForm.title" placeholder="可选，留空自动生成" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="genVisible = false">取消</el-button>
        <el-button type="primary" :loading="genLoading" @click="doGenerate">生成报告</el-button>
      </template>
    </el-dialog>

    <!-- 报告预览弹窗 -->
    <el-dialog v-model="viewVisible" :title="viewReportData?.title" width="800px" top="5vh">
      <div v-if="viewReportData" class="report-preview">
        <div class="report-meta">
          <el-tag size="small">{{ typeLabel(viewReportData.reportType) }}</el-tag>
          <span class="meta-period">{{ viewReportData.reportPeriod }}</span>
          <span class="meta-time">生成于 {{ formatTime(viewReportData.generateTime) }}</span>
          <span class="meta-views"><el-icon><View /></el-icon> {{ viewReportData.viewCount }}</span>
        </div>
        <div v-if="viewReportData.summary" class="report-summary">{{ viewReportData.summary }}</div>

        <div v-if="viewSections.length > 0" class="report-body">
          <div v-for="(sec, i) in viewSections" :key="i" class="report-section">
            <h4 v-if="sec.title">{{ sec.title }}</h4>

            <!-- 文本 -->
            <p v-if="sec.type === 'text'" class="sec-text">{{ sec.content }}</p>

            <!-- 网格指标 -->
            <div v-if="sec.type === 'grid'" class="sec-grid">
              <div v-for="(item, j) in sec.items" :key="j" class="grid-item">
                <span class="grid-val" :style="{ color: item.color || '#0F172A' }">{{ item.value }}</span>
                <span class="grid-unit" v-if="item.unit">{{ item.unit }}</span>
                <span class="grid-label">{{ item.label }}</span>
              </div>
            </div>

            <!-- 表格 -->
            <el-table v-if="sec.type === 'table'" :data="sec.rows" size="small" border>
              <el-table-column v-for="(h, j) in sec.headers" :key="j" :label="h" :prop="String(j)" />
            </el-table>
          </div>
        </div>

        <div v-if="viewReportData.tags" class="report-tags">
          <el-tag v-for="tag in viewReportData.tags.split(',')" :key="tag" size="small" type="info" style="margin-right:6px">{{ tag }}</el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="viewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, View, Document, Cpu, BellFilled, PieChart, Setting } from '@element-plus/icons-vue'
import { listReport, getReport, generateReport, delReport } from '@/api/system/report'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const reportTypes = [
  { value: 'monthly_ops', label: '供水运行月报', desc: '月度供水运行综合统计', icon: 'Document', color: '#0D9488', bg: '#CCFBF1' },
  { value: 'device_ops', label: '设备运行报告', desc: '设备在线率及运行状态', icon: 'Cpu', color: '#2563EB', bg: '#DBEAFE' },
  { value: 'alarm_analysis', label: '报警分析报告', desc: '报警趋势及处理率分析', icon: 'BellFilled', color: '#DC2626', bg: '#FEE2E2' },
  { value: 'zone_water', label: '分区水量报告', desc: '分区水量及产销差概览', icon: 'PieChart', color: '#D97706', bg: '#FEF3C7' },
  { value: 'custom', label: '自定义报告', desc: '自由编辑报告内容', icon: 'Setting', color: '#6366F1', bg: '#E0E7FF' },
]

const typeLabel = (v) => reportTypes.find(t => t.value === v)?.label || v
const formatTime = (t) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : ''

// 列表
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const filterType = ref('')
const keyword = ref('')

function fetchList() {
  loading.value = true
  listReport({ pageNum: pageNum.value, pageSize: pageSize.value, reportType: filterType.value || undefined, keyword: keyword.value || undefined })
    .then(res => {
      if (res.data) {
        tableData.value = res.data.rows || []
        total.value = res.data.total || 0
      }
    })
    .finally(() => { loading.value = false })
}

function handleDelete(row) {
  ElMessageBox.confirm('确定删除该报告？', '提示', { type: 'warning' }).then(() => {
    delReport(row.reportId).then(() => {
      ElMessage.success('删除成功')
      fetchList()
    })
  }).catch(() => {})
}

// 生成
const genVisible = ref(false)
const genLoading = ref(false)
const genForm = ref({ reportType: '', periodDate: '', title: '' })

function openGenerate(t) {
  genForm.value = { reportType: t.value, periodDate: dayjs().format('YYYY-MM'), title: '' }
  genVisible.value = true
}

function doGenerate() {
  const { reportType, periodDate, title } = genForm.value
  const period = reportType === 'device_ops' ? dayjs().format('YYYY-MM') : (periodDate || dayjs().format('YYYY-MM'))
  genLoading.value = true
  generateReport({ reportType, reportPeriod: period, title: title || undefined })
    .then(res => {
      if (res.data) {
        ElMessage.success('报告生成成功')
        genVisible.value = false
        fetchList()
        // 自动打开预览
        viewReportData.value = res.data
        viewVisible.value = true
      } else {
        ElMessage.error(res.msg || '生成失败')
      }
    })
    .finally(() => { genLoading.value = false })
}

// 查看
const viewVisible = ref(false)
const viewReportData = ref(null)

const viewSections = computed(() => {
  if (!viewReportData.value?.content) return []
  try {
    const c = typeof viewReportData.value.content === 'string'
      ? JSON.parse(viewReportData.value.content) : viewReportData.value.content
    return c.sections || []
  } catch { return [] }
})

function viewReport(row) {
  getReport(row.reportId).then(res => {
    if (res.data) {
      viewReportData.value = res.data
      viewVisible.value = true
    }
  })
}

onMounted(() => { fetchList() })
</script>

<style lang="scss" scoped>
.report-center {
  padding: 20px 24px;
}

.type-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.type-card {
  background: #FFF;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  padding: 20px 16px;
  cursor: pointer;
  transition: all .2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,.08);
  }
}

.type-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-name {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.type-desc {
  font-size: 12px;
  color: #94A3B8;
}

// 列表
.list-card {
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  box-shadow: none;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

// 报告预览
.report-preview {
  max-height: 65vh;
  overflow-y: auto;
}

.report-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #64748B;
  flex-wrap: wrap;
}

.report-summary {
  font-size: 14px;
  color: #475569;
  padding: 10px 14px;
  background: #F8FAFC;
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 3px solid #0D9488;
}

.report-body {
  .report-section {
    margin-bottom: 20px;
    h4 { font-size: 15px; color: #0F172A; margin: 0 0 10px 0; padding-left: 10px; border-left: 3px solid #0D9488; }
    .sec-text { font-size: 14px; color: #475569; line-height: 1.7; margin: 0; }
  }
}

.sec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.grid-item {
  background: #F8FAFC;
  border-radius: 8px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.grid-val {
  font-size: 26px;
  font-weight: 700;
}

.grid-unit {
  font-size: 11px;
  color: #94A3B8;
  margin-top: -4px;
}

.grid-label {
  font-size: 12px;
  color: #64748B;
  margin-top: 2px;
}

.report-tags {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
}

@media (max-width: 1200px) {
  .type-cards { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .type-cards { grid-template-columns: repeat(2, 1fr); }
  .toolbar { flex-wrap: wrap; }
}
</style>
