<template>
  <div class="dashboard-container">
    <div class="welcome-banner">
      <div class="welcome-content">
        <h1>Welcome back, Admin 👋</h1>
        <p>Here's what's happening with your system today. Manage your services, monitor traffic, and review the latest analytics.</p>
        <div class="welcome-actions">
          <el-button type="primary" size="large" icon="Document" @click="goTarget('/docs')">View Documentation</el-button>
          <el-button size="large" plain @click="goTarget('https://gitee.com/tao-zhi/nest-admin')">GitHub Repository</el-button>
        </div>
      </div>
      <div class="welcome-illustration">
        <!-- Abstract decorative shapes -->
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
      </div>
    </div>

    <el-row :gutter="24" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="stat in stats" :key="stat.title">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <span class="stat-title">{{ stat.title }}</span>
            <div class="stat-icon" :style="{ backgroundColor: stat.bgColor, color: stat.color }">
              <el-icon><component :is="stat.icon" /></el-icon>
            </div>
          </div>
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-footer">
            <span :class="['trend', stat.trend > 0 ? 'up' : 'down']">
              {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
            </span>
            <span class="trend-text">from last month</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="info-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="system-info-card">
          <template #header>
            <div class="card-header">
              <span>System Overview</span>
              <el-tag type="success" effect="light" round>Running Smoothly</el-tag>
            </div>
          </template>
          <div class="info-content">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="Version">v{{ version }}</el-descriptions-item>
              <el-descriptions-item label="License">MIT Open Source</el-descriptions-item>
              <el-descriptions-item label="Architecture">Microservices</el-descriptions-item>
              <el-descriptions-item label="Framework">NestJS 10 + Vue 3</el-descriptions-item>
              <el-descriptions-item label="Database">MySQL 8.0</el-descriptions-item>
              <el-descriptions-item label="Cache">Redis 6.2</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="quick-links-card">
          <template #header>
            <div class="card-header">
              <span>Quick Actions</span>
            </div>
          </template>
          <div class="link-list">
            <a href="#" class="link-item">
              <div class="link-icon"><el-icon><User /></el-icon></div>
              <div class="link-text">
                <h4>Manage Users</h4>
                <p>Add or modify user accounts</p>
              </div>
              <el-icon class="link-arrow"><ArrowRight /></el-icon>
            </a>
            <a href="#" class="link-item">
              <div class="link-icon"><el-icon><Setting /></el-icon></div>
              <div class="link-text">
                <h4>System Settings</h4>
                <p>Configure global parameters</p>
              </div>
              <el-icon class="link-arrow"><ArrowRight /></el-icon>
            </a>
            <a href="#" class="link-item">
              <div class="link-icon"><el-icon><Monitor /></el-icon></div>
              <div class="link-text">
                <h4>View Logs</h4>
                <p>Check system operation logs</p>
              </div>
              <el-icon class="link-arrow"><ArrowRight /></el-icon>
            </a>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Index">
import { ref } from 'vue'

const version = ref('1.0.0')

const stats = ref([
  { title: 'Total Users', value: '12,423', icon: 'UserFilled', color: '#4F46E5', bgColor: '#EEF2FF', trend: 12.5 },
  { title: 'Active Sessions', value: '892', icon: 'Monitor', color: '#10B981', bgColor: '#ECFDF5', trend: 5.2 },
  { title: 'API Requests', value: '1.2M', icon: 'Connection', color: '#F59E0B', bgColor: '#FEF3C7', trend: -2.4 },
  { title: 'System Alerts', value: '3', icon: 'Warning', color: '#EF4444', bgColor: '#FEF2F2', trend: 0 }
])

function goTarget(url) {
  window.open(url, '__blank')
}
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
}

.welcome-banner {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  border-radius: 20px;
  padding: 48px;
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

  .welcome-content {
    position: relative;
    z-index: 2;
    max-width: 600px;

    h1 {
      color: #FFFFFF;
      font-size: 36px;
      font-weight: 700;
      margin: 0 0 16px 0;
      letter-spacing: -0.5px;
    }

    p {
      color: #94A3B8;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 32px 0;
    }

    .welcome-actions {
      display: flex;
      gap: 16px;
      
      .el-button {
        border-radius: 8px;
        font-weight: 500;
        
        &.el-button--primary {
          background: #4F46E5;
          border-color: #4F46E5;
          &:hover { background: #4338CA; border-color: #4338CA; }
        }
        
        &.is-plain {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
          &:hover { 
            background: rgba(255, 255, 255, 0.2);
            color: #FFFFFF; 
          }
        }
      }
    }
  }

  .welcome-illustration {
    position: absolute;
    right: 0;
    top: 0;
    width: 50%;
    height: 100%;
    z-index: 1;

    .shape {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
    }

    .shape-1 {
      width: 300px;
      height: 300px;
      background: rgba(79, 70, 229, 0.4);
      top: -50px;
      right: -50px;
    }

    .shape-2 {
      width: 250px;
      height: 250px;
      background: rgba(16, 185, 129, 0.3);
      bottom: -100px;
      right: 150px;
    }
  }
}

.stat-row {
  margin-bottom: 32px;
}

.stat-card {
  border: none !important;
  
  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .stat-title {
      color: #64748B;
      font-size: 14px;
      font-weight: 500;
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
  }

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: #0F172A;
    margin-bottom: 12px;
    letter-spacing: -1px;
  }

  .stat-footer {
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;

    .trend {
      font-weight: 600;
      &.up { color: #10B981; }
      &.down { color: #EF4444; }
    }

    .trend-text {
      color: #94A3B8;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: #0F172A;
}

.system-info-card {
  height: 100%;
  
  :deep(.el-descriptions__label) {
    width: 140px;
    background-color: #F8FAFC;
    color: #475569;
    font-weight: 500;
  }
  
  :deep(.el-descriptions__content) {
    color: #0F172A;
    font-weight: 500;
  }
}

.quick-links-card {
  height: 100%;

  .link-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .link-item {
    display: flex;
    align-items: center;
    padding: 16px;
    border-radius: 12px;
    background: #F8FAFC;
    text-decoration: none;
    transition: all 0.2s ease;
    border: 1px solid transparent;

    &:hover {
      background: #FFFFFF;
      border-color: #E2E8F0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      transform: translateY(-2px);
      
      .link-arrow {
        transform: translateX(4px);
        color: #4F46E5;
      }
    }

    .link-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #FFFFFF;
      color: #4F46E5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-right: 16px;
    }

    .link-text {
      flex: 1;

      h4 {
        margin: 0 0 4px 0;
        font-size: 15px;
        color: #0F172A;
        font-weight: 600;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #64748B;
      }
    }

    .link-arrow {
      color: #94A3B8;
      font-size: 16px;
      transition: all 0.2s ease;
    }
  }
}

@media (max-width: 768px) {
  .welcome-banner {
    padding: 32px 24px;
    
    .welcome-illustration {
      display: none;
    }
    
    .welcome-content {
      h1 { font-size: 28px; }
      .welcome-actions { flex-direction: column; }
    }
  }
}
</style>
