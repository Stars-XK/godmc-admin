<template>
  <div class="iot-home">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-content">
        <h1 class="banner-title">智慧水务 IoT 管理平台</h1>
        <p class="banner-desc">实时监控 · 智能报警 · 数据分析 · DMA 漏损管理</p>
      </div>
      <div class="banner-wave">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.08)"/>
          <path d="M0,80 C320,40 640,120 960,80 C1120,60 1280,100 1440,80 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.05)"/>
        </svg>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="iot-dashboard-grid">
      <div class="iot-stat-card">
        <div class="stat-icon icon-teal"><el-icon :size="22"><Odometer /></el-icon></div>
        <div class="stat-value">{{ stats.zoneCount || '-' }}</div>
        <div class="stat-label">管理分区</div>
      </div>
      <div class="iot-stat-card">
        <div class="stat-icon icon-green"><el-icon :size="22"><Monitor /></el-icon></div>
        <div class="stat-value">{{ stats.deviceCount || '-' }}</div>
        <div class="stat-label">在线设备</div>
      </div>
      <div class="iot-stat-card">
        <div class="stat-icon icon-blue"><el-icon :size="22"><Connection /></el-icon></div>
        <div class="stat-value">{{ stats.pointCount || '-' }}</div>
        <div class="stat-label">监测点位</div>
      </div>
      <div class="iot-stat-card">
        <div class="stat-icon icon-amber"><el-icon :size="22"><BellFilled /></el-icon></div>
        <div class="stat-value">{{ stats.alarmCount || '-' }}</div>
        <div class="stat-label">今日报警</div>
      </div>
    </div>

    <!-- 系统信息卡片 -->
    <el-row :gutter="16">
      <el-col :xs="24" :lg="12">
        <el-card class="iot-card" shadow="never">
          <div class="iot-section-title">
            <el-icon><Cpu /></el-icon>
            <span>微服务状态</span>
          </div>
          <div class="service-grid">
            <div v-for="svc in services" :key="svc.name" class="service-item">
              <span class="service-dot" :class="svc.online ? 'online' : 'offline'"></span>
              <span class="service-name">{{ svc.name }}</span>
              <span class="service-port">{{ svc.port }}</span>
            </div>
          </div>
          <div class="card-footer-link">
            <el-button link type="primary" @click="$router.push('/monitor/registry')">
              查看服务注册详情 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card class="iot-card" shadow="never">
          <div class="iot-section-title">
            <el-icon><Grid /></el-icon>
            <span>快捷入口</span>
          </div>
          <div class="quick-links">
            <div class="quick-link" @click="$router.push('/water-basic/zone')">
              <el-icon :size="28"><MapLocation /></el-icon>
              <span>分区管理</span>
            </div>
            <div class="quick-link" @click="$router.push('/water-basic/station-device-point')">
              <el-icon :size="28"><Setting /></el-icon>
              <span>设备管理</span>
            </div>
            <div class="quick-link" @click="$router.push('/alarm/rule')">
              <el-icon :size="28"><BellFilled /></el-icon>
              <span>报警规则</span>
            </div>
            <div class="quick-link" @click="$router.push('/data-integration/source')">
              <el-icon :size="28"><Connection /></el-icon>
              <span>数据接入</span>
            </div>
            <div class="quick-link" @click="$router.push('/system/config')">
              <el-icon :size="28"><Tools /></el-icon>
              <span>系统配置</span>
            </div>
            <div class="quick-link" @click="$router.push('/monitor/server')">
              <el-icon :size="28"><Monitor /></el-icon>
              <span>服务监控</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 技术栈 -->
    <el-card class="iot-card tech-card" shadow="never" style="margin-top: 16px;">
      <div class="iot-section-title">
        <el-icon><Stamp /></el-icon>
        <span>技术架构</span>
      </div>
      <div class="tech-stack">
        <span class="tech-tag">NestJS 10</span>
        <span class="tech-tag">Vue 3</span>
        <span class="tech-tag">TypeScript</span>
        <span class="tech-tag">TDengine 3</span>
        <span class="tech-tag">MySQL 8</span>
        <span class="tech-tag">Redis 6</span>
        <span class="tech-tag">Kafka</span>
        <span class="tech-tag">Docker</span>
        <span class="tech-tag">PM2</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Odometer, Monitor, Connection, BellFilled, Cpu, Grid, MapLocation, Setting, Tools, Stamp, ArrowRight } from '@element-plus/icons-vue'

const stats = ref({
  zoneCount: 0,
  deviceCount: 0,
  pointCount: 0,
  alarmCount: 0,
})

const services = ref([
  { name: 'API 网关', port: '8080', online: true },
  { name: '鉴权服务', port: '3001', online: true },
  { name: '系统服务', port: '3002', online: true },
  { name: '监控服务', port: '3003', online: true },
  { name: '文件服务', port: '3004', online: true },
  { name: '工具服务', port: '3005', online: true },
  { name: '水务台账', port: '3006', online: true },
  { name: '数据集成', port: '3007', online: true },
  { name: '报警中心', port: '3008', online: true },
])

onMounted(() => {
  document.title = '智慧水务 IoT 管理平台'
})
</script>

<style lang="scss" scoped>
.iot-home {
  padding: 0;
  min-height: calc(100vh - 84px);
}

/* 欢迎横幅 */
.welcome-banner {
  background: linear-gradient(135deg, #0F766E 0%, #0D9488 40%, #14B8A6 100%);
  padding: 40px 32px 20px;
  position: relative;
  overflow: hidden;
  margin: -20px -20px 20px -20px;
  border-radius: 0 0 16px 16px;

  .banner-content {
    position: relative;
    z-index: 2;
  }

  .banner-title {
    font-size: 26px;
    font-weight: 700;
    color: #FFFFFF;
    margin: 0 0 8px 0;
  }

  .banner-desc {
    font-size: 14px;
    color: rgba(255,255,255,0.75);
    margin: 0;
  }

  .banner-wave {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 80px;
  }
}

/* 卡片样式 */
.iot-card {
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 20px;
  }
}

/* 微服务网格 */
.service-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #F8FAFC;
  border-radius: 6px;
  font-size: 13px;
}

.service-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.online { background: #10B981; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }
  &.offline { background: #EF4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
}

.service-name {
  color: #334155;
  flex: 1;
}

.service-port {
  color: #94A3B8;
  font-family: monospace;
  font-size: 12px;
}

/* 快捷入口 */
.quick-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  background: #F8FAFC;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: #334155;

  &:hover {
    background: #F0FDFA;
    color: #0D9488;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(13,148,136,0.1);
  }

  span {
    font-size: 13px;
    font-weight: 500;
  }
}

/* 技术栈 */
.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-tag {
  padding: 4px 14px;
  background: #F0FDFA;
  color: #0F766E;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.card-footer-link {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
}

@media (max-width: 768px) {
  .service-grid { grid-template-columns: repeat(2, 1fr); }
  .quick-links { grid-template-columns: repeat(2, 1fr); }
}
</style>
