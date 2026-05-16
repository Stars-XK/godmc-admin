<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="handleClose"
    :title="title"
    fullscreen
    destroy-on-close
    class="dataflow-dialog"
    @opened="onDialogOpened"
    @closed="onDialogClosed"
  >
    <div class="dataflow-body">
      <!-- 顶部统计条 -->
      <div class="stats-bar">
        <div
          v-for="s in stages"
          :key="s.key"
          class="stat-item"
          :class="{ active: s.active }"
          @click="focusStage(s)"
          @mouseenter="hoverStage(s)"
          @mouseleave="hoverStage(null)"
        >
          <div class="stat-icon" :style="{ background: s.color }">
            <el-icon :size="18" color="#fff"><component :is="s.icon" /></el-icon>
          </div>
          <div class="stat-body">
            <span class="stat-num">{{ s.count || '--' }}</span>
            <span class="stat-label">{{ s.shortLabel }}</span>
          </div>
        </div>
      </div>

      <!-- Canvas 流向图 -->
      <div class="canvas-section" ref="canvasSectionRef">
        <canvas ref="canvasRef" class="flow-canvas"></canvas>

        <!-- 节点标签 overlay -->
        <div
          v-for="(s, i) in stages"
          :key="s.key"
          class="node-label"
          :class="{ hovered: hoveredStage === s.key, focused: focusedStage?.key === s.key }"
          :style="{ left: nodePositions[i]?.labelX + 'px', top: nodePositions[i]?.labelY + 'px' }"
          @click="focusStage(s)"
        >
          <span class="nl-name">{{ s.label }}</span>
        </div>

        <!-- 图例 -->
        <div class="legend-bar">
          <span class="legend-item"><span class="leg-dot active"></span> 活跃中</span>
          <span class="legend-item"><span class="leg-dot idle"></span> 待命中</span>
          <span class="legend-item"><span class="leg-dot flow"></span> 数据流</span>
          <span class="legend-item">{{ particleCount }} 粒子</span>
        </div>
      </div>

      <!-- 选中阶段详情 -->
      <div class="detail-section" v-if="focusedStage">
        <div class="detail-header">
          <span class="dh-dot" :style="{ background: focusedStage.color }"></span>
          <span class="dh-title">{{ focusedStage.label }}</span>
          <span class="dh-desc">{{ focusedStage.description }}</span>
          <el-button circle size="small" @click="focusedStage = null"><el-icon><Close /></el-icon></el-button>
        </div>
        <div class="detail-cards">
          <div class="d-card" v-if="focusedStage.method">
            <span class="dc-label">核心方法</span>
            <span class="dc-value mono">{{ focusedStage.method }}</span>
          </div>
          <div class="d-card" v-if="focusedStage.file">
            <span class="dc-label">源码位置</span>
            <span class="dc-value mono small">{{ focusedStage.file }}</span>
          </div>
          <div class="d-card" v-if="focusedStage.input">
            <span class="dc-label">数据输入</span>
            <span class="dc-value">{{ focusedStage.input }}</span>
          </div>
          <div class="d-card" v-if="focusedStage.output">
            <span class="dc-label">数据输出</span>
            <span class="dc-value">{{ focusedStage.output }}</span>
          </div>
          <div class="d-card" v-if="focusedStage.frequency">
            <span class="dc-label">执行频率</span>
            <span class="dc-value">{{ focusedStage.frequency }}</span>
          </div>
          <div class="d-card" v-if="focusedStage.tech">
            <span class="dc-label">涉及技术</span>
            <span class="dc-value">{{ focusedStage.tech }}</span>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Close } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '数据流转' },
  stages: { type: Array, required: true },
  particleCount: { type: Number, default: 80 },
})

const emit = defineEmits(['update:modelValue'])

function handleClose(val) {
  emit('update:modelValue', val)
}

// ============ Canvas 状态 ============
const canvasRef = ref(null)
const canvasSectionRef = ref(null)
const focusedStage = ref(null)
const hoveredStage = ref(null)

let ctx = null
let w = 0, h = 0
let animId = null
const particles = []
const nodePositions = ref([])
let pulsePhases = []

function focusStage(s) {
  focusedStage.value = focusedStage.value?.key === s.key ? null : s
}
function hoverStage(s) {
  hoveredStage.value = s?.key || null
}

// ============ 粒子类 ============
class FlowParticle {
  constructor(route) {
    this.route = route
    this.t = Math.random()
    this.speed = 0.002 + Math.random() * 0.006
    this.size = 1.5 + Math.random() * 2.5
    this.color = route.color
    this.alpha = 0.4 + Math.random() * 0.6
  }
  update() {
    this.t += this.speed
    if (this.t > 1) {
      this.t = 0
      this.speed = 0.002 + Math.random() * 0.006
    }
  }
  draw(ctx, fx, fy, tx, ty) {
    const cx = fx + (tx - fx) * this.t
    const cy = fy + (ty - fy) * this.t + Math.sin(this.t * Math.PI) * 8
    ctx.save()
    ctx.globalAlpha = this.alpha
    ctx.fillStyle = this.color
    ctx.shadowColor = this.color
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(cx, cy, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = this.alpha * 0.4
    ctx.beginPath()
    ctx.arc(cx - (tx - fx) * 0.004, cy, this.size * 0.7, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// ============ Canvas 绘制 ============
function initCanvas() {
  if (!canvasRef.value || !canvasSectionRef.value) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvasSectionRef.value.getBoundingClientRect()
  w = rect.width
  h = rect.height
  if (w === 0 || h === 0) return false
  canvasRef.value.width = w * dpr
  canvasRef.value.height = h * dpr
  canvasRef.value.style.width = w + 'px'
  canvasRef.value.style.height = h + 'px'
  ctx = canvasRef.value.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return true
}

function computeNodePositions() {
  const padding = 60
  const count = props.stages.length
  if (count < 2) {
    nodePositions.value = []
    return []
  }
  const usableWidth = w - padding * 2
  const spacing = usableWidth / (count - 1)
  const centerY = h * 0.45
  const positions = []
  for (let i = 0; i < count; i++) {
    const x = padding + spacing * i
    const y = centerY + Math.sin(i * 0.5) * 30
    positions.push({ x, y, radius: 24, labelX: x, labelY: centerY + 54 })
  }
  nodePositions.value = positions
  return positions
}

function spawnParticles() {
  if (nodePositions.value.length < 2) return
  const routes = []
  const defaultColors = [
    '#3B82F6', '#6366F1', '#0D9488', '#D97706',
    '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899',
    '#F97316', '#06B6D4',
  ]
  for (let i = 0; i < nodePositions.value.length - 1; i++) {
    routes.push({
      fromIdx: i,
      toIdx: i + 1,
      color: props.stages[i]?.color || defaultColors[i] || '#60A5FA',
    })
  }
  for (let i = 0; i < props.particleCount; i++) {
    const route = routes[Math.floor(Math.random() * routes.length)]
    particles.push(new FlowParticle(route))
  }
}

function drawPipeline(ctx, positions) {
  if (positions.length < 2) return
  for (let i = 0; i < positions.length - 1; i++) {
    const from = positions[i]
    const to = positions[i + 1]
    const fromColor = props.stages[i]?.color || '#60A5FA'
    const toColor = props.stages[i + 1]?.color || '#60A5FA'
    const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
    gradient.addColorStop(0, fromColor + '60')
    gradient.addColorStop(1, toColor + '60')
    ctx.strokeStyle = gradient
    ctx.lineWidth = 3
    ctx.setLineDash([8, 4])
    ctx.lineDashOffset = -performance.now() * 0.03
    ctx.beginPath()
    ctx.moveTo(from.x + from.radius, from.y)
    ctx.lineTo(to.x - to.radius, to.y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.strokeStyle = gradient
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.moveTo(from.x + from.radius, from.y - 4)
    ctx.lineTo(to.x - to.radius, to.y - 4)
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  for (let i = 0; i < positions.length; i++) {
    const { x, y, radius } = positions[i]
    const stage = props.stages[i]
    const pulse = Math.sin(pulsePhases[i]) * 0.3 + 0.7
    if (stage.active) {
      ctx.save()
      ctx.globalAlpha = 0.15 * pulse
      ctx.fillStyle = stage.color
      ctx.shadowColor = stage.color
      ctx.shadowBlur = 24
      ctx.beginPath()
      ctx.arc(x, y, radius + 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    ctx.strokeStyle = stage.color
    ctx.lineWidth = 2
    ctx.globalAlpha = stage.active ? 1 : 0.4
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
    const grad = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, radius - 2)
    grad.addColorStop(0, stage.color)
    grad.addColorStop(1, stage.color + '40')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, radius - 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    if (stage.active) {
      const rippleR = radius + 12 + Math.sin(pulsePhases[i] * 3 + performance.now() * 0.002) * 6
      ctx.strokeStyle = stage.color
      ctx.lineWidth = 1.5
      ctx.globalAlpha = 1 - (rippleR - radius - 12) / 12
      ctx.beginPath()
      ctx.arc(x, y, rippleR, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }
}

function animate() {
  if (!ctx) return
  for (let i = 0; i < pulsePhases.length; i++) {
    pulsePhases[i] += 0.02 + Math.random() * 0.005
  }
  ctx.clearRect(0, 0, w, h)
  const positions = computeNodePositions()
  // 背景网格
  ctx.strokeStyle = 'rgba(255,255,255,0.02)'
  ctx.lineWidth = 1
  const gridSize = 40
  for (let x = gridSize; x < w; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = gridSize; y < h; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
  drawPipeline(ctx, positions)
  for (const p of particles) {
    const from = positions[p.route.fromIdx]
    const to = positions[p.route.toIdx]
    if (!from || !to) continue
    const fx = from.x + from.radius
    const fy = from.y
    const tx = to.x - to.radius
    const ty = to.y
    p.draw(ctx, fx, fy, tx, ty)
    p.update()
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title + ' — 数据流转全链路', w / 2, 24)
  animId = requestAnimationFrame(animate)
}

function handleResize() {
  const ok = initCanvas()
  if (!ok) return
  particles.length = 0
  spawnParticles()
}

function onDialogOpened() {
  pulsePhases = props.stages.map(() => Math.random() * Math.PI * 2)
  particles.length = 0
  nextTick(() => {
    const ok = initCanvas()
    if (!ok) return
    computeNodePositions()
    spawnParticles()
    animate()
  })
  window.addEventListener('resize', handleResize)
}

function onDialogClosed() {
  if (animId) cancelAnimationFrame(animId)
  animId = null
  ctx = null
  focusedStage.value = null
  hoveredStage.value = null
  window.removeEventListener('resize', handleResize)
}
</script>

<style lang="scss" scoped>
:deep(.dataflow-dialog) {
  .el-dialog {
    background: #0B1120;
    margin: 0 !important;
    border-radius: 0;
  }
  .el-dialog__header {
    background: rgba(15, 23, 42, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    margin: 0;
    padding: 14px 24px;
  }
  .el-dialog__title {
    font-size: 17px;
    font-weight: 700;
    color: #E2E8F0;
  }
  .el-dialog__headerbtn {
    top: 14px;
    .el-dialog__close {
      color: #94A3B8;
      &:hover { color: #E2E8F0; }
    }
  }
  .el-dialog__body {
    padding: 0;
    height: calc(100vh - 56px);
    overflow: hidden;
  }
}

.dataflow-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.stats-bar {
  display: flex;
  gap: 0;
  padding: 10px 20px;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  overflow-x: auto;
  flex-shrink: 0;
  &::-webkit-scrollbar { height: 2px; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 1px; }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s;
  flex-shrink: 0;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    right: -1px;
    top: 25%;
    height: 50%;
    width: 1px;
    background: rgba(255, 255, 255, 0.06);
  }
  &:last-child::after { display: none; }
  &:hover { background: rgba(255, 255, 255, 0.04); transform: translateY(-1px); }
  &.active { background: rgba(255, 255, 255, 0.06); box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08); }
}

.stat-icon {
  width: 34px; height: 34px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s;
  .stat-item:hover & { transform: scale(1.08); }
}

.stat-body { display: flex; flex-direction: column; min-width: 36px; }
.stat-num { font-size: 16px; font-weight: 700; color: #E2E8F0; line-height: 1.2; }
.stat-label { font-size: 10px; color: #64748B; }

.canvas-section { flex: 1; position: relative; min-height: 0; }
.flow-canvas { width: 100%; height: 100%; display: block; }

.node-label {
  position: absolute;
  transform: translateX(-50%);
  cursor: pointer;
  transition: all 0.3s;
  pointer-events: auto;
  &.hovered .nl-name { color: #fff; text-shadow: 0 0 12px rgba(255,255,255,0.4); transform: scale(1.05); }
  &:has(.nl-name) .focused & .nl-name,
  &.focused .nl-name { color: #5EEAD4; text-shadow: 0 0 14px rgba(94,234,212,0.5); transform: scale(1.08); }
}

.nl-name {
  font-size: 12px; font-weight: 600; color: #94A3B8;
  white-space: nowrap; display: block; transition: all 0.3s;
}

.legend-bar {
  position: absolute; bottom: 16px; right: 24px;
  display: flex; gap: 20px; font-size: 11px; color: #64748B;
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.leg-dot {
  width: 8px; height: 8px; border-radius: 50%;
  &.active { background: #10B981; box-shadow: 0 0 6px #10B981; }
  &.idle { background: #475569; }
  &.flow { background: #60A5FA; box-shadow: 0 0 6px #60A5FA; }
}

.detail-section {
  flex-shrink: 0;
  background: rgba(15, 23, 42, 0.98);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 16px 24px;
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.dh-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.dh-title { font-size: 15px; font-weight: 700; color: #E2E8F0; }
.dh-desc { font-size: 13px; color: #94A3B8; flex: 1; }
.detail-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.d-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px; padding: 12px 14px;
  display: flex; flex-direction: column; gap: 4px;
  transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
}
.dc-label { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
.dc-value {
  font-size: 13px; color: #CBD5E1; font-weight: 500;
  &.mono { font-family: 'JetBrains Mono','Fira Code',monospace; font-size: 12px; color: #5EEAD4; }
  &.small { font-size: 11px; color: #94A3B8; }
}

@media (max-width: 992px) {
  .detail-cards { grid-template-columns: repeat(2, 1fr); }
  .stats-bar { padding: 8px 12px; }
}
</style>
