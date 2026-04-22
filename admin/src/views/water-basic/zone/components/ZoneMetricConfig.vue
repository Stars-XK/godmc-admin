<template>
  <el-drawer
    :title="`分区指标计算配置 - ${zoneName}`"
    v-model="visible"
    direction="rtl"
    size="1100px"
    @close="handleClose"
    append-to-body
    class="metric-drawer"
  >
    <div class="metric-container">
      <!-- 顶部：指标类型切换 -->
      <div class="metric-header">
        <span class="header-label">配置指标类型：</span>
        <el-radio-group v-model="currentMetric" size="large" @change="loadMetricConfig">
          <el-radio-button label="water_supply">
            <el-icon><DataLine /></el-icon> 总供水量 (累计)
          </el-radio-button>
          <el-radio-button label="min_flow">
            <el-icon><Odometer /></el-icon> 夜间最小流量 (瞬时)
          </el-radio-button>
        </el-radio-group>
      </div>

      <div class="metric-body">
        <!-- 左侧：本分区设备测点树 -->
        <div class="left-panel">
          <div class="panel-title">
            <span>备选测点池</span>
            <el-tooltip content="列表仅显示已关联到当前分区的设备及其测点" placement="top">
              <el-icon class="info-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="tree-wrapper">
            <el-input v-model="filterText" placeholder="搜索设备或测点名称" prefix-icon="Search" clearable class="mb-2" />
            <el-tree
              ref="treeRef"
              :data="deviceTree"
              :props="defaultProps"
              :filter-node-method="filterNode"
              node-key="id"
              default-expand-all
              highlight-current
              class="custom-tree"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node" :class="{ 'is-disabled-node': data.isPoint && isPointInPool(data.code) }">
                  <el-icon v-if="!data.isPoint"><Cpu /></el-icon>
                  <el-icon v-else class="point-icon"><LocationInformation /></el-icon>
                  <span class="node-label" :class="{ 'is-point': data.isPoint }">{{ node.label }}</span>
                  <div v-if="data.isPoint && !isPointInPool(data.code)" class="node-actions">
                    <el-button type="primary" link size="small" @click.stop="addPoint(data, 1)" title="添加为进水(加)">
                      <el-icon><Plus /></el-icon> 进水
                    </el-button>
                    <el-button type="danger" link size="small" @click.stop="addPoint(data, -1)" title="添加为出水(减)">
                      <el-icon><Minus /></el-icon> 出水
                    </el-button>
                  </div>
                  <div v-else-if="data.isPoint && isPointInPool(data.code)" class="node-status">
                    <el-tag size="small" type="info" effect="plain">已添加</el-tag>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>
        </div>

        <!-- 右侧：公式画板 / 进出水边界 -->
        <div class="right-panel">
          <div class="panel-title">
            <span>计算公式画板</span>
            <span class="formula-preview">当前公式: ∑(进水) - ∑(出水)</span>
          </div>
          
          <div class="calc-board">
            <!-- 进水区域 -->
            <div class="calc-zone in-zone">
              <div class="zone-header">
                <div class="zone-title"><el-icon><Plus /></el-icon> 进水测点 (相加)</div>
                <span class="count-badge">{{ inPoints.length }}</span>
              </div>
              <div class="zone-content">
                <el-empty v-if="inPoints.length === 0" description="请从左侧选择测点添加到此处" :image-size="60" />
                <div v-for="item in inPoints" :key="item.pointCode" class="point-item in-item">
                  <div class="point-info">
                    <span class="point-name">{{ item.pointName }}</span>
                    <span class="point-code">{{ item.pointCode }}</span>
                  </div>
                  <el-icon class="remove-btn" @click="removePoint(item.pointCode, 1)"><Close /></el-icon>
                </div>
              </div>
            </div>

            <!-- 出水区域 -->
            <div class="calc-zone out-zone mt-3">
              <div class="zone-header">
                <div class="zone-title"><el-icon><Minus /></el-icon> 出水测点 (相减)</div>
                <span class="count-badge">{{ outPoints.length }}</span>
              </div>
              <div class="zone-content">
                <el-empty v-if="outPoints.length === 0" description="请从左侧选择测点添加到此处" :image-size="60" />
                <div v-for="item in outPoints" :key="item.pointCode" class="point-item out-item">
                  <div class="point-info">
                    <span class="point-name">{{ item.pointName }}</span>
                    <span class="point-code">{{ item.pointCode }}</span>
                  </div>
                  <el-icon class="remove-btn" @click="removePoint(item.pointCode, -1)"><Close /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="drawer-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitSave">
          <el-icon><Check /></el-icon> 保存配置
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, watch, computed, getCurrentInstance } from 'vue'
import { getMetricCalcTree, getZoneMetricCalcConfig, saveZoneMetricCalcConfig } from '@/api/water-basic/zone-bind'

const props = defineProps({
  modelValue: Boolean,
  zoneCode: String,
  zoneName: String
})

const emit = defineEmits(['update:modelValue', 'success'])
const { proxy } = getCurrentInstance()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const currentMetric = ref('water_supply')
const deviceTree = ref([])
const defaultProps = { children: 'children', label: 'label' }

const filterText = ref('')
const treeRef = ref(null)

const inPoints = ref([])  // calcSign: 1
const outPoints = ref([]) // calcSign: -1

const saving = ref(false)

watch(() => props.modelValue, (val) => {
  if (val && props.zoneCode) {
    currentMetric.value = 'water_supply'
    filterText.value = ''
    loadTree()
    loadMetricConfig()
  }
})

watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

function filterNode(value, data) {
  if (!value) return true
  return data.label.indexOf(value) !== -1 || (data.code && data.code.indexOf(value) !== -1)
}

function handleClose() {
  inPoints.value = []
  outPoints.value = []
  deviceTree.value = []
}

// 1. 加载左侧树
async function loadTree() {
  const res = await getMetricCalcTree(props.zoneCode)
  deviceTree.value = res.data || []
}

// 2. 加载右侧配置
async function loadMetricConfig() {
  const res = await getZoneMetricCalcConfig(props.zoneCode, currentMetric.value)
  const configList = res.data || []
  
  inPoints.value = configList.filter(item => item.calcSign === 1)
  outPoints.value = configList.filter(item => item.calcSign === -1)
}

// 添加测点到计算池
function addPoint(nodeData, sign) {
  const targetList = sign === 1 ? inPoints.value : outPoints.value
  
  // 检查是否已在任一池中存在
  const existsIn = inPoints.value.find(p => p.pointCode === nodeData.code)
  const existsOut = outPoints.value.find(p => p.pointCode === nodeData.code)
  
  if (existsIn || existsOut) {
    proxy.$modal.msgWarning(`该测点已经在计算池中了`)
    return
  }

  targetList.push({
    pointCode: nodeData.code,
    pointName: nodeData.label,
    calcSign: sign
  })
}

// 从计算池移除测点
function removePoint(pointCode, sign) {
  if (sign === 1) {
    inPoints.value = inPoints.value.filter(p => p.pointCode !== pointCode)
  } else {
    outPoints.value = outPoints.value.filter(p => p.pointCode !== pointCode)
  }
}

// 检查该测点是否已经在计算池中（左侧树样式绑定用）
function isPointInPool(pointCode) {
  return inPoints.value.some(p => p.pointCode === pointCode) || 
         outPoints.value.some(p => p.pointCode === pointCode);
}

// 提交保存
async function submitSave() {
  saving.value = true
  try {
    const points = [
      ...inPoints.value.map(p => ({ pointCode: p.pointCode, calcSign: 1 })),
      ...outPoints.value.map(p => ({ pointCode: p.pointCode, calcSign: -1 }))
    ]

    await saveZoneMetricCalcConfig({
      zoneCode: props.zoneCode,
      metricType: currentMetric.value,
      points
    })
    
    proxy.$modal.msgSuccess('保存成功')
    emit('success')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.metric-drawer :deep(.el-drawer__body) {
  padding: 0;
  overflow: hidden;
}

.metric-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f7fa;
}

.metric-header {
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
}
.header-label {
  font-weight: 600;
  color: #303133;
  margin-right: 16px;
}

.metric-body {
  flex: 1;
  display: flex;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.info-icon {
  color: #909399;
  cursor: help;
}

/* 左侧树 */
.left-panel {
  flex: 4;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}
.tree-wrapper {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}
.custom-tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  padding-right: 8px;
}
.custom-tree-node .el-icon {
  margin-right: 6px;
  color: #909399;
}
.custom-tree-node .point-icon {
  color: #409EFF;
}
.node-label {
  flex: 1;
  font-size: 14px;
}
.node-label.is-point {
  color: #606266;
}
.node-actions {
  display: none;
}
.custom-tree-node:hover .node-actions {
  display: flex;
  gap: 4px;
}
.is-disabled-node {
  opacity: 0.6;
}
.is-disabled-node .point-icon {
  color: #909399;
}
.node-status {
  display: flex;
  align-items: center;
}

/* 右侧画板 */
.right-panel {
  flex: 6;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}
.formula-preview {
  font-size: 13px;
  color: #409EFF;
  background: #eef5fe;
  padding: 4px 12px;
  border-radius: 12px;
}

.calc-board {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #fafbfc;
}

.calc-zone {
  border-radius: 8px;
  border: 1px solid;
  background: #fff;
  overflow: hidden;
}
.in-zone { border-color: #b3d8ff; }
.out-zone { border-color: #fbc4c4; }

.zone-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.in-zone .zone-header { background: #ecf5ff; }
.out-zone .zone-header { background: #fef0f0; }

.zone-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.in-zone .zone-title { color: #409EFF; }
.out-zone .zone-title { color: #F56C6C; }

.count-badge {
  background: rgba(0,0,0,0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.zone-content {
  padding: 16px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.point-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 6px;
  transition: all 0.3s;
}
.in-item {
  background: #fdfdfd;
  border: 1px dashed #c6e2ff;
}
.in-item:hover { border-color: #409EFF; box-shadow: 0 2px 8px rgba(64,158,255,0.1); }

.out-item {
  background: #fdfdfd;
  border: 1px dashed #fbc4c4;
}
.out-item:hover { border-color: #F56C6C; box-shadow: 0 2px 8px rgba(245,108,108,0.1); }

.point-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.point-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
.point-code {
  font-size: 12px;
  color: #909399;
}

.remove-btn {
  color: #C0C4CC;
  cursor: pointer;
  padding: 4px;
  transition: color 0.3s;
}
.remove-btn:hover {
  color: #F56C6C;
}

.drawer-footer {
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>