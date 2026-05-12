<template>
  <div class="iot-monitor-server">
    <div class="iot-page-header">
      <div class="page-title">服务监控</div>
      <div class="page-actions">
        <el-button type="primary" size="default" @click="getList" :loading="loading" icon="Refresh">刷新数据</el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- CPU -->
      <el-col :xs="24" :lg="12">
        <el-card class="monitor-card" shadow="never">
          <template #header>
            <div class="card-header"><el-icon :size="18"><Cpu /></el-icon><span>CPU</span></div>
          </template>
          <div class="monitor-table">
            <table>
              <thead><tr><th>属性</th><th>值</th></tr></thead>
              <tbody>
                <tr><td>核心数</td><td class="val">{{ server.cpu?.cpuNum || '-' }}</td></tr>
                <tr><td>用户使用率</td><td class="val" :class="usageClass(server.cpu?.used)">{{ server.cpu?.used || 0 }}%</td></tr>
                <tr><td>系统使用率</td><td class="val">{{ server.cpu?.sys || 0 }}%</td></tr>
                <tr><td>当前空闲率</td><td class="val" :class="freeClass(server.cpu?.free)">{{ server.cpu?.free || 0 }}%</td></tr>
              </tbody>
            </table>
          </div>
        </el-card>
      </el-col>

      <!-- 内存 -->
      <el-col :xs="24" :lg="12">
        <el-card class="monitor-card" shadow="never">
          <template #header>
            <div class="card-header"><el-icon :size="18"><Tickets /></el-icon><span>内存</span></div>
          </template>
          <div class="monitor-table">
            <table>
              <thead><tr><th>属性</th><th>内存</th><th v-if="server.jvm">JVM</th></tr></thead>
              <tbody>
                <tr><td>总内存</td><td class="val">{{ server.mem?.total || 0 }}G</td><td class="val" v-if="server.jvm">{{ server.jvm.total }}M</td></tr>
                <tr><td>已用内存</td><td class="val">{{ server.mem?.used || 0 }}G</td><td class="val" v-if="server.jvm">{{ server.jvm.used }}M</td></tr>
                <tr><td>剩余内存</td><td class="val">{{ server.mem?.free || 0 }}G</td><td class="val" v-if="server.jvm">{{ server.jvm.free }}M</td></tr>
                <tr><td>使用率</td><td class="val" :class="usageClass(server.mem?.usage)">{{ server.mem?.usage || 0 }}%</td><td class="val" :class="usageClass(server.jvm?.usage)" v-if="server.jvm">{{ server.jvm.usage }}%</td></tr>
              </tbody>
            </table>
          </div>
        </el-card>
      </el-col>

      <!-- 服务器信息 -->
      <el-col :span="24">
        <el-card class="monitor-card" shadow="never">
          <template #header>
            <div class="card-header"><el-icon :size="18"><Monitor /></el-icon><span>服务器信息</span></div>
          </template>
          <div class="monitor-table">
            <table>
              <tbody>
                <tr><td>服务器名称</td><td class="val">{{ server.sys?.computerName || '-' }}</td><td>操作系统</td><td class="val">{{ server.sys?.osName || '-' }}</td></tr>
                <tr><td>服务器IP</td><td class="val">{{ server.sys?.computerIp || '-' }}</td><td>系统架构</td><td class="val">{{ server.sys?.osArch || '-' }}</td></tr>
              </tbody>
            </table>
          </div>
        </el-card>
      </el-col>

      <!-- 磁盘 -->
      <el-col :span="24">
        <el-card class="monitor-card" shadow="never">
          <template #header>
            <div class="card-header"><el-icon :size="18"><FolderOpened /></el-icon><span>磁盘状态</span></div>
          </template>
          <div class="monitor-table">
            <table>
              <thead>
                <tr>
                  <th>盘符路径</th><th>文件系统</th><th>盘符类型</th><th>总大小</th><th>可用大小</th><th>已用大小</th><th>已用百分比</th>
                </tr>
              </thead>
              <tbody v-if="server.sysFiles">
                <tr v-for="(f, i) in server.sysFiles" :key="i">
                  <td class="val">{{ f.dirName }}</td>
                  <td>{{ f.sysTypeName }}</td>
                  <td>{{ f.typeName }}</td>
                  <td>{{ f.total }}</td>
                  <td>{{ f.free }}</td>
                  <td>{{ f.used }}</td>
                  <td class="val" :class="usageClass(f.usage)">{{ f.usage }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue'
import { getServer } from '@/api/monitor/server'
import { Cpu, Tickets, Monitor, FolderOpened } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()
const server = ref({})
const loading = ref(false)

function getList() {
  loading.value = true
  getServer().then(res => {
    server.value = res.data
    loading.value = false
  }).catch(() => { loading.value = false })
}

function usageClass(v) {
  if (v == null) return ''
  const n = Number(v)
  if (n >= 80) return 'text-danger'
  if (n >= 60) return 'text-warning'
  return 'text-success'
}

function freeClass(v) {
  if (v == null) return ''
  const n = Number(v)
  if (n <= 10) return 'text-danger'
  if (n <= 30) return 'text-warning'
  return ''
}

getList()
</script>

<style lang="scss" scoped>
.iot-monitor-server {
  padding: 24px;
}

.monitor-card {
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  margin-bottom: 16px;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #F1F5F9;
    background: #FAFBFC;
  }
  :deep(.el-card__body) {
    padding: 0;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
  color: #0F172A;

  .el-icon { color: #0D9488; }
}

.monitor-table {
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    background: #F0FDFA;
    color: #0F766E;
    font-weight: 600;
    font-size: 13px;
    padding: 12px 16px;
    text-align: left;
    border-bottom: 2px solid #CCFBF1;
  }

  td {
    padding: 10px 16px;
    font-size: 13px;
    color: #334155;
    border-bottom: 1px solid #F1F5F9;
  }

  tr:hover td { background: #F8FAFC; }

  .val { font-weight: 600; font-family: 'JetBrains Mono', 'Fira Code', monospace; }

  .text-danger { color: #EF4444; }
  .text-warning { color: #F59E0B; }
  .text-success { color: #10B981; }
}
</style>
