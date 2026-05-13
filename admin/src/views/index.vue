<template>
  <div class="iot-home">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-inner">
        <div class="banner-text">
          <h1 class="banner-title">智慧水务 IoT 管理平台</h1>
          <p class="banner-desc">实时监控 · 智能报警 · 数据分析 · DMA 漏损管理</p>
        </div>
        <div class="banner-stats">
          <div class="banner-stat">
            <span class="banner-stat-num">{{ stats.zoneCount ?? '--' }}</span>
            <span class="banner-stat-label">管理分区</span>
          </div>
          <div class="banner-stat">
            <span class="banner-stat-num">{{ stats.deviceCount ?? '--' }}</span>
            <span class="banner-stat-label">在线设备</span>
          </div>
          <div class="banner-stat">
            <span class="banner-stat-num">{{ stats.pointCount ?? '--' }}</span>
            <span class="banner-stat-label">监测点位</span>
          </div>
          <div class="banner-stat">
            <span class="banner-stat-num">{{ stats.alarmCount ?? '--' }}</span>
            <span class="banner-stat-label">今日报警</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="iot-content">
      <el-row :gutter="20">
        <el-col :xs="24" :lg="14">
          <el-card class="iot-card" shadow="never">
            <template #header>
              <div class="card-title"><el-icon :size="18"><Cpu /></el-icon><span>微服务状态</span></div>
            </template>
            <div class="service-grid">
              <div v-for="svc in services" :key="svc.name" class="service-item">
                <span class="service-dot" :class="svc.online ? 'online' : 'offline'"></span>
                <span class="service-name">{{ svc.name }}</span>
                <span class="service-port">{{ svc.port }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="10">
          <el-card class="iot-card" shadow="never">
            <template #header>
              <div class="card-title"><el-icon :size="18"><Grid /></el-icon><span>快捷入口</span></div>
            </template>
            <div class="quick-links">
              <div class="quick-link" @click="$router.push('/water-basic/zone')">
                <el-icon :size="24"><MapLocation /></el-icon>
                <span>分区管理</span>
              </div>
              <div class="quick-link" @click="$router.push('/water-basic/station-device-point')">
                <el-icon :size="24"><Setting /></el-icon>
                <span>设备管理</span>
              </div>
              <div class="quick-link" @click="$router.push('/alarm/rule')">
                <el-icon :size="24"><BellFilled /></el-icon>
                <span>报警规则</span>
              </div>
              <div class="quick-link" @click="$router.push('/data-integration/source')">
                <el-icon :size="24"><Connection /></el-icon>
                <span>数据接入</span>
              </div>
              <div class="quick-link" @click="$router.push('/system/config')">
                <el-icon :size="24"><Tools /></el-icon>
                <span>系统配置</span>
              </div>
              <div class="quick-link" @click="$router.push('/monitor/server')">
                <el-icon :size="24"><Monitor /></el-icon>
                <span>服务监控</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="iot-card" shadow="never">
        <template #header>
          <div class="card-title"><el-icon :size="18"><Stamp /></el-icon><span>技术架构</span></div>
        </template>
        <div class="tech-stack">
          <span class="tech-tag">NestJS 10</span>
          <span class="tech-tag">Vue 3</span>
          <span class="tech-tag">TypeScript</span>
          <span class="tech-tag">TDengine 3.x</span>
          <span class="tech-tag">MySQL 8.0</span>
          <span class="tech-tag">Redis 6.2</span>
          <span class="tech-tag">Kafka</span>
          <span class="tech-tag">Docker</span>
          <span class="tech-tag">PM2</span>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Cpu, Grid, MapLocation, Setting, BellFilled, Connection, Tools, Monitor, Stamp } from '@element-plus/icons-vue'
import request from '@/utils/request'

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

function fetchStats() {
  request({ url: '/system/home/stats', method: 'get' }).then(res => {
    if (res.data) {
      stats.value = res.data
    }
  }).catch(() => {})
}

onMounted(() => {
  document.title = '智慧水务 IoT 管理平台'
  fetchStats()
})
</script>

<style lang="scss" scoped>
.iot-home {
  min-height: calc(100vh - 84px);
  background: #F8FAFC;
}

.welcome-banner {
  background: linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #14B8A6 100%);
}

.banner-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 36px 32px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.banner-text {
  flex: 1;
  min-width: 220px;
}

.banner-title {
  font-size: 24px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 8px 0;
  letter-spacing: 0.02em;
}

.banner-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.72);
  margin: 0;
  letter-spacing: 0.04em;
}

.banner-stats {
  display: flex;
  flex-direction: row;
  gap: 32px;
  flex-shrink: 0;
}

.banner-stat {
  text-align: center;
  min-width: 64px;
}

.banner-stat-num {
  display: block;
  font-size: 28px;
  font-weight: 800;
  color: #FFFFFF;
  line-height: 1.2;
}

.banner-stat-label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 4px;
}

.iot-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 32px 40px;
}

.iot-card {
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
}

.iot-card :deep(.el-card__header) {
  padding: 16px 20px 12px;
  border-bottom: 1px solid #F1F5F9;
  background: #FAFBFC;
}

.iot-card :deep(.el-card__body) {
  padding: 20px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
}

.card-title .el-icon {
  color: #0D9488;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #F8FAFC;
  border-radius: 8px;
  font-size: 13px;
  transition: background 0.15s;
}

.service-item:hover {
  background: #F0FDFA;
}

.service-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.service-dot.online {
  background: #10B981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.service-dot.offline {
  background: #EF4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

.service-name {
  color: #334155;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.service-port {
  color: #94A3B8;
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 12px;
  flex-shrink: 0;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 12px;
  background: #F8FAFC;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: #475569;
}

.quick-link:hover {
  background: #F0FDFA;
  color: #0D9488;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.08);
}

.quick-link span {
  font-size: 13px;
  font-weight: 500;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tech-tag {
  padding: 6px 16px;
  background: #F0FDFA;
  color: #0F766E;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

@media (max-width: 992px) {
  .banner-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .banner-stats {
    width: 100%;
    justify-content: space-around;
  }

  .service-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .quick-links {
    grid-template-columns: repeat(2, 1fr);
  }

  .iot-content {
    padding: 20px 16px 32px;
  }
}
</style>
