<template>
  <div class="dataflow-page">
    <!-- ====== 顶部统计 ====== -->
    <div class="stats-bar">
      <div v-for="s in stages" :key="s.key" class="stat-item" :class="{ active: s.active }"
        @click="focusStage(s)" @mouseenter="hoverStage(s)" @mouseleave="hoverStage(null)">
        <div class="stat-icon" :style="{ background: s.color }">
          <el-icon :size="20" color="#fff"><component :is="s.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <span class="stat-num">{{ s.count || '--' }}</span>
          <span class="stat-label">{{ s.shortLabel }}</span>
        </div>
      </div>
    </div>

    <!-- ====== Canvas 流向图 ====== -->
    <div class="canvas-section" ref="canvasSectionRef">
      <canvas ref="canvasRef" class="flow-canvas"></canvas>

      <!-- 节点标签 overlay -->
      <div
        v-for="(s, i) in stages"
        :key="s.key"
        class="node-label"
        :class="{ hovered: hoveredStage === s.key, focused: focusedStage === s.key }"
        :style="{ left: nodePositions[i]?.labelX + 'px', top: nodePositions[i]?.labelY + 'px' }"
        @click="focusStage(s)"
      >
        <span class="nl-name">{{ s.label }}</span>
      </div>

      <!-- 图例说明 -->
      <div class="legend-bar">
        <span class="legend-item"><span class="leg-dot active"></span> 活跃中</span>
        <span class="legend-item"><span class="leg-dot idle"></span> 待命中</span>
        <span class="legend-item"><span class="leg-dot flow"></span> 数据流</span>
        <span class="legend-item">{{ particleCount }} 粒子</span>
      </div>
    </div>

    <!-- ====== 选中阶段详情 ====== -->
    <div class="detail-section" v-if="focusedStage">
      <div class="detail-header">
        <span class="dh-dot" :style="{ background: focusedStage.color }"></span>
        <span class="dh-title">{{ focusedStage.label }}</span>
        <span class="dh-desc">{{ focusedStage.description }}</span>
        <el-button circle size="small" @click="focusedStage = null"><el-icon><Close /></el-icon></el-button>
      </div>
      <div class="detail-cards">
        <div class="d-card">
          <span class="dc-label">核心方法</span>
          <span class="dc-value mono">{{ focusedStage.method || '—' }}</span>
        </div>
        <div class="d-card">
          <span class="dc-label">源码位置</span>
          <span class="dc-value mono small">{{ focusedStage.file || '—' }}</span>
        </div>
        <div class="d-card">
          <span class="dc-label">数据输入</span>
          <span class="dc-value">{{ focusedStage.input }}</span>
        </div>
        <div class="d-card">
          <span class="dc-label">数据输出</span>
          <span class="dc-value">{{ focusedStage.output }}</span>
        </div>
        <div class="d-card">
          <span class="dc-label">执行频率</span>
          <span class="dc-value">{{ focusedStage.frequency }}</span>
        </div>
        <div class="d-card">
          <span class="dc-label">涉及技术</span>
          <span class="dc-value">{{ focusedStage.tech }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import {
  Cpu, Monitor, TrendCharts, Search, MagicStick, Switch, BellFilled,
  Message, Close, CircleCheck,
} from '@element-plus/icons-vue'

// ============ 阶段定义 ============
const stages = reactive([
  {
    key: 'collection', label: '数据采集', shortLabel: '采集',
    icon: Cpu, color: '#3B82F6',
    description: 'KafkaConsumerService 消费设备 MQTT/Kafka 消息，ReceiverService 解析 JSON → 写入 TDengine',
    tech: 'Kafka / MQTT', input: '传感器原始信号', output: 'TDengine 子表数据行',
    frequency: '实时 (秒级)', method: 'KafkaConsumerService.eachMessage()', file: 'micro-data-integration/engine/kafka-consumer.service.ts',
    active: true, count: '—',
  },
  {
    key: 'storage', label: '时序存储', shortLabel: '存储',
    icon: Monitor, color: '#6366F1',
    description: 'TDengine 超级表 water_iot.meters，按 device_code+point_code 自动建子表',
    tech: 'TDengine 3.x', input: 'ReceiverService 写入请求', output: 'd_<device>_<point> 子表',
    frequency: '实时写入', method: 'ReceiverService.receiveData()', file: 'micro-data-integration/receiver/receiver.service.ts',
    active: true, count: '—',
  },
  {
    key: 'aggregation', label: '流计算聚合', shortLabel: '聚合',
    icon: TrendCharts, color: '#0D9488',
    description: 'TdengineAggService 5分钟滚动窗口: AVG(val), MAX(val), MIN(val), SPREAD, DIFF → meters_5m/zone_meters_5m',
    tech: 'TDengine 窗口 SQL', input: 'meters 原始数据', output: 'meters_5m + zone_meters_5m',
    frequency: '5 分钟/次', method: 'TdengineAggService.rollup5m()', file: 'micro-data-integration/tdengine/tdengine-agg.service.ts',
    active: true, count: '—',
  },
  {
    key: 'polling', label: 'TMQ 轮询', shortLabel: '轮询',
    icon: Search, color: '#D97706',
    description: 'TmqService 每 30s 执行 pollAndEvaluate()，查最新 5min 数据，构建 {deviceCode, pointCode, avgVal, maxVal...} facts',
    tech: 'REST API 轮询', input: 'meters_5m 最近 5 分钟', output: 'facts 事实对象数组',
    frequency: '30 秒/次', method: 'TmqService.pollDeviceData()', file: 'micro-alarm/tmq/tmq.service.ts',
    active: true, count: '—',
  },
  {
    key: 'engine', label: '规则引擎', shortLabel: '引擎',
    icon: MagicStick, color: '#8B5CF6',
    description: 'EngineService.evaluate() → ruleIndex.get(targetKey) O(1) 查找规则 → json-rules-engine.run(facts) 执行条件树匹配',
    tech: 'json-rules-engine', input: 'facts + IndexedRule[]', output: 'success/failure 事件',
    frequency: '每条数据实时', method: 'EngineService.evaluate()', file: 'micro-alarm/engine/engine.service.ts',
    active: true, count: '—',
  },
  {
    key: 'debounce', label: '防抖判断', shortLabel: '防抖',
    icon: Switch, color: '#F59E0B',
    description: 'count 模式: Redis ZADD→ZCARD 窗口计数达阈值触发 | time 模式: SET NX EX → GET 检查持续时长',
    tech: 'Redis ZSET / String', input: 'success 事件 + debounce 配置', output: '确认触发 / 暂不触发',
    frequency: '每次命中评估', method: 'handleRuleMatch() debounce分支', file: 'micro-alarm/engine/engine.service.ts:277-325',
    active: false, count: '—',
  },
  {
    key: 'alarm', label: '报警生成', shortLabel: '报警',
    icon: BellFilled, color: '#EF4444',
    description: 'SETNX alarm:active:{ruleId}:{deviceId} 原子去重 → historyRep.save() 写入 sys_alarm_history → 更新 Redis 状态',
    tech: 'TypeORM + Redis SETNX', input: '确认信号 + rule/device 信息', output: 'sys_alarm_history 记录',
    frequency: '触发时', method: 'fireAlarm()', file: 'micro-alarm/engine/engine.service.ts:354-384',
    active: false, count: '—',
  },
  {
    key: 'notify', label: '通知推送', shortLabel: '推送',
    icon: Message, color: '#EC4899',
    description: 'Promise.allSettled([sendWebhook, sendEmail, sendSms]) 并行通知 + EventsGateway.pushAlarm() WebSocket 前端实时推送',
    tech: 'Axios + Socket.IO', input: 'AlarmNotification 对象', output: 'Webhook POST / Email SMTP / SMS 阿里云',
    frequency: '报警后异步', method: 'NotifyService.sendAlarmNotification()', file: 'micro-alarm/notify/notify.service.ts',
    active: false, count: '—',
  },
])

const focusedStage = ref(null)
const hoveredStage = ref(null)

function focusStage(s) {
  focusedStage.value = focusedStage.value?.key === s.key ? null : s
}
function hoverStage(s) {
  hoveredStage.value = s?.key || null
}

// ============ Canvas 绘制 ============
const canvasRef = ref(null)
const canvasSectionRef = ref(null)
const particleCount = ref(120)

let ctx = null
let w = 0, h = 0
let animId = null
const particles = []
const nodePositions = ref([])
const pulsePhases = reactive(stages.map(() => Math.random() * Math.PI * 2))

// 粒子类
class FlowParticle {
  constructor(route) {
    this.route = route // 经过哪条连线 [fromIdx, toIdx]
    this.t = Math.random() // 0~1 在线上的位置
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

  draw(ctx, from, to) {
    const x = from.x + (to.x - from.x) * this.t
    const y = from.y + (to.y - from.y) * this.t
    // 贝塞尔曲线位置
    const cpY = from.y + (to.y - from.y) * 0.3
    const bx = from.x + (to.x - from.x) * this.t
    const by = from.y + (to.y - from.y) * this.t + Math.sin(this.t * Math.PI) * (cpY - from.y) * 0.3
    const finalX = bx
    const finalY = by

    ctx.save()
    ctx.globalAlpha = this.alpha
    ctx.fillStyle = this.color
    ctx.shadowColor = this.color
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(finalX, finalY, this.size, 0, Math.PI * 2)
    ctx.fill()

    // glow
    ctx.globalAlpha = this.alpha * 0.3
    ctx.beginPath()
    ctx.arc(finalX, finalY, this.size * 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

function initCanvas() {
  if (!canvasRef.value || !canvasSectionRef.value) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvasSectionRef.value.getBoundingClientRect()
  w = rect.width
  h = rect.height
  canvasRef.value.width = w * dpr
  canvasRef.value.height = h * dpr
  canvasRef.value.style.width = w + 'px'
  canvasRef.value.style.height = h + 'px'
  ctx = canvasRef.value.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function computeNodePositions() {
  const padding = 60
  const nodeCount = stages.length
  const usableWidth = w - padding * 2
  const spacing = usableWidth / (nodeCount - 1)
  const centerY = h * 0.45

  const positions = []
  for (let i = 0; i < nodeCount; i++) {
    const x = padding + spacing * i
    const y = centerY + Math.sin(i * 0.5) * 30
    positions.push({
      x, y,
      radius: 24,
      labelX: x,
      labelY: centerY + 54,
    })
  }
  nodePositions.value = positions
  return positions
}

function spawnParticles() {
  if (nodePositions.value.length < 2) return
  const routes = []
  for (let i = 0; i < nodePositions.value.length - 1; i++) {
    const colors = [
      '#3B82F6', '#6366F1', '#0D9488', '#D97706',
      '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899',
    ]
    routes.push({
      fromIdx: i, toIdx: i + 1,
      color: colors[i],
    })
  }

  for (let i = 0; i < particleCount.value; i++) {
    const route = routes[Math.floor(Math.random() * routes.length)]
    particles.push(new FlowParticle(route))
  }
}

function drawPipeline(ctx, positions) {
  if (positions.length < 2) return

  // 连线
  for (let i = 0; i < positions.length - 1; i++) {
    const from = positions[i]
    const to = positions[i + 1]
    const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
    gradient.addColorStop(0, stages[i].color + '60')
    gradient.addColorStop(1, stages[i + 1].color + '60')

    ctx.strokeStyle = gradient
    ctx.lineWidth = 3
    ctx.setLineDash([8, 4])
    ctx.lineDashOffset = -performance.now() * 0.03
    ctx.beginPath()
    ctx.moveTo(from.x + from.radius, from.y)
    ctx.lineTo(to.x - to.radius, to.y)
    ctx.stroke()
    ctx.setLineDash([])

    // 第二层细线
    ctx.strokeStyle = gradient
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.moveTo(from.x + from.radius, from.y - 4)
    ctx.lineTo(to.x - to.radius, to.y - 4)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // 节点
  for (let i = 0; i < positions.length; i++) {
    const { x, y, radius } = positions[i]
    const stage = stages[i]
    const pulse = Math.sin(pulsePhases[i]) * 0.3 + 0.7

    // 外发光
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

    // 光环
    ctx.strokeStyle = stage.color
    ctx.lineWidth = 2
    ctx.globalAlpha = stage.active ? 1 : 0.4
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1

    // 主体圆
    const grad = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, radius - 2)
    grad.addColorStop(0, stage.color)
    grad.addColorStop(1, stage.color + '40')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, radius - 2, 0, Math.PI * 2)
    ctx.fill()

    // 内点
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()

    // 活跃脉冲波纹
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

  // 更新脉冲相位
  for (let i = 0; i < pulsePhases.length; i++) {
    pulsePhases[i] += 0.02 + Math.random() * 0.005
  }

  ctx.clearRect(0, 0, w, h)

  const positions = computeNodePositions()

  // 画背景网格
  ctx.strokeStyle = 'rgba(255,255,255,0.02)'
  ctx.lineWidth = 1
  const gridSize = 40
  for (let x = gridSize; x < w; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = gridSize; y < h; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  // 画管线
  drawPipeline(ctx, positions)

  // 画粒子
  for (const p of particles) {
    const from = positions[p.route.fromIdx]
    const to = positions[p.route.toIdx]
    if (!from || !to) continue
    // 从节点边缘出发
    const fx = from.x + from.radius
    const fy = from.y
    const tx = to.x - to.radius
    const ty = to.y
    const cx = fx + (tx - fx) * p.t
    const cy = fy + (ty - fy) * p.t + Math.sin(p.t * Math.PI) * 8

    ctx.save()
    ctx.globalAlpha = p.alpha
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(cx, cy, p.size, 0, Math.PI * 2)
    ctx.fill()
    // tail
    ctx.globalAlpha = p.alpha * 0.4
    ctx.beginPath()
    ctx.arc(cx - (tx - fx) * 0.004, cy, p.size * 0.7, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    p.update()
  }

  // 标题
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('智慧水务报警数据流 — 端到端管道', w / 2, 24)

  animId = requestAnimationFrame(animate)
}

function handleResize() {
  initCanvas()
  // 重新分布粒子路由
  particles.length = 0
  spawnParticles()
}

onMounted(() => {
  nextTick(() => {
    initCanvas()
    computeNodePositions()
    spawnParticles()
    animate()
  })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.dataflow-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  background: #0B1120;
  overflow: hidden;
}

/* ========== 顶部统计条 ========== */
.stats-bar {
  display: flex;
  gap: 0;
  padding: 12px 20px;
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

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    transform: translateY(-1px);
  }
  &.active {
    background: rgba(255, 255, 255, 0.06);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
  }
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s;
  .stat-item:hover & { transform: scale(1.08); }
}

.stat-body {
  display: flex;
  flex-direction: column;
  min-width: 40px;
}

.stat-num {
  font-size: 18px;
  font-weight: 700;
  color: #E2E8F0;
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  color: #64748B;
}

/* ========== Canvas 区域 ========== */
.canvas-section {
  flex: 1;
  position: relative;
  min-height: 0;
}

.flow-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.node-label {
  position: absolute;
  transform: translateX(-50%);
  cursor: pointer;
  transition: all 0.3s;
  pointer-events: auto;

  &.hovered .nl-name {
    color: #fff;
    text-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
    transform: scale(1.05);
  }
  &.focused .nl-name {
    color: #5EEAD4;
    text-shadow: 0 0 14px rgba(94, 234, 212, 0.5);
    transform: scale(1.08);
  }
}

.nl-name {
  font-size: 12px;
  font-weight: 600;
  color: #94A3B8;
  white-space: nowrap;
  display: block;
  transition: all 0.3s;
}

/* 图例 */
.legend-bar {
  position: absolute;
  bottom: 16px;
  right: 24px;
  display: flex;
  gap: 20px;
  font-size: 11px;
  color: #64748B;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.leg-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  &.active { background: #10B981; box-shadow: 0 0 6px #10B981; }
  &.idle { background: #475569; }
  &.flow { background: #60A5FA; box-shadow: 0 0 6px #60A5FA; }
}

/* ========== 详情面板 ========== */
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

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.dh-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dh-title {
  font-size: 15px;
  font-weight: 700;
  color: #E2E8F0;
}

.dh-desc {
  font-size: 13px;
  color: #94A3B8;
  flex: 1;
}

.detail-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.d-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.2s;
  &:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1); }
}

.dc-label {
  font-size: 11px;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dc-value {
  font-size: 13px;
  color: #CBD5E1;
  font-weight: 500;
  &.mono {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 12px;
    color: #5EEAD4;
  }
  &.small { font-size: 11px; color: #94A3B8; }
}

@media (max-width: 992px) {
  .detail-cards { grid-template-columns: repeat(2, 1fr); }
  .stats-bar { padding: 8px 12px; }
}
</style>
