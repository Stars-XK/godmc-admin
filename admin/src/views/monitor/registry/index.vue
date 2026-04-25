<template>
  <div class="app-container registry-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">在线微服务监控</h2>
        <span class="page-subtitle">基于 Redis 心跳实时检测</span>
      </div>
      <div class="header-right">
        <el-button type="primary" icon="Refresh" @click="getList" :loading="loading" round>手动刷新</el-button>
      </div>
    </div>

    <el-row :gutter="24" class="service-cards" v-loading="loading">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6" v-for="(service, index) in serviceList" :key="index">
        <el-card class="service-card" shadow="hover" :class="{'is-offline': service.status !== 'online'}">
          <div class="card-top">
            <div class="status-indicator">
              <span class="breathing-light" :class="service.status === 'online' ? 'light-online' : 'light-offline'"></span>
              <span class="status-text">{{ service.status === 'online' ? '运行中' : '已离线' }}</span>
            </div>
            <div class="memory-badge" v-if="service.memoryUsage">
              <el-icon><Cpu /></el-icon>
              <span>{{ (service.memoryUsage / 1024 / 1024).toFixed(1) }} MB</span>
            </div>
          </div>
          
          <div class="service-name">
            <el-icon class="service-icon" :color="service.status === 'online' ? '#409EFF' : '#909399'"><Monitor /></el-icon>
            <div class="service-titles">
              <h3>{{ serviceNameMap[service.name] || service.name }}</h3>
              <span class="service-subname">{{ service.name }}</span>
            </div>
          </div>
          
          <div class="service-desc">
            {{ serviceDescMap[service.name] || '提供基础业务接口支撑' }}
          </div>

          <div class="service-info">
            <div class="info-item">
              <span class="info-label">主机地址</span>
              <span class="info-value code-font">{{ service.host }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">服务端口</span>
              <span class="info-value code-font">{{ service.port }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最后心跳</span>
              <span class="info-value time-font">{{ parseTime(service.lastHeartbeat) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="!loading && serviceList.length === 0" description="暂无在线微服务" />
  </div>
</template>

<script setup name="Registry">
import { ref, onMounted, onUnmounted } from 'vue';
import { listOnlineServices } from '@/api/monitor/registry';
import { parseTime } from '@/utils/ruoyi';

const loading = ref(true);
const serviceList = ref([]);
let timer = null;

const serviceNameMap = {
  'api-gateway': '网关服务 (Gateway)',
  'micro-auth': '认证服务 (Auth)',
  'micro-system': '系统管理 (System)',
  'micro-monitor': '系统监控 (Monitor)',
  'micro-upload': '文件服务 (Upload)',
  'micro-tools': '工具服务 (Tools)',
  'micro-water-basic': '水务基础 (Water Basic)',
  'micro-data-integration': '数据接入 (Data Integration)',
  'micro-alarm': '报警中心 (Alarm Module)',
};

const serviceDescMap = {
  'api-gateway': '全局路由分发、请求拦截、安全控制',
  'micro-auth': '用户登录、Token签发、身份认证中心',
  'micro-system': '用户、角色、菜单、字典等基础配置',
  'micro-monitor': '微服务心跳注册、操作日志、系统监控',
  'micro-upload': '本地与云端对象存储的文件上传服务',
  'micro-tools': '代码生成、代码编辑器、实用工具集',
  'micro-water-basic': '分区、站点、设备、测点等资产管理',
  'micro-data-integration': '多协议数据接入、TDengine流计算与写入',
  'micro-alarm': '复杂规则引擎，并集/交集策略及静默容错降级通知',
};

function getList() {
  loading.value = true;
  listOnlineServices().then(response => {
    // 按照微服务名称排序
    serviceList.value = response.data ? response.data.sort((a, b) => a.name.localeCompare(b.name)) : [];
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

onMounted(() => {
  getList();
  // 每 10 秒自动刷新一次列表
  timer = setInterval(() => {
    listOnlineServices().then(response => {
      serviceList.value = response.data ? response.data.sort((a, b) => a.name.localeCompare(b.name)) : [];
    }).catch(() => {});
  }, 10000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.registry-container {
  padding: 24px;
  background-color: transparent;
  min-height: calc(100vh - 84px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.page-subtitle {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
  display: block;
}

.service-cards {
  margin-bottom: -24px; /* offset the bottom margin of cols */
}

.el-col {
  margin-bottom: 24px;
}

.service-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  position: relative;
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08) !important;
}

.service-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #409EFF, #67C23A);
}

.service-card.is-offline::before {
  background: #F56C6C;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* Breathing Light */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0,0,0,0.03);
  padding: 4px 12px 4px 8px;
  border-radius: 16px;
}

.breathing-light {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.light-online {
  background-color: #67C23A;
  box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.7);
  animation: breathe-green 2s infinite;
}

.light-offline {
  background-color: #F56C6C;
  box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7);
}

@keyframes breathe-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(103, 194, 58, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(103, 194, 58, 0); }
}

.status-text {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
}

.is-offline .status-text {
  color: #F56C6C;
}

.memory-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #409EFF;
  background: #ecf5ff;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.service-name {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.service-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.service-icon {
  font-size: 28px;
  background: #f4f4f5;
  padding: 8px;
  border-radius: 10px;
}

.service-name h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
  word-break: break-all;
}

.service-subname {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.service-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 16px;
  min-height: 20px;
}

.service-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 13px;
  color: #909399;
}

.info-value {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.code-font {
  font-family: 'Consolas', 'Monaco', monospace;
  background: #ebeef5;
  padding: 2px 6px;
  border-radius: 4px;
  color: #606266;
}

.time-font {
  font-size: 12px;
}
</style>
