<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span>在线微服务列表 (基于 Redis 心跳检测)</span>
          <el-button type="primary" icon="Refresh" @click="getList" size="small">手动刷新</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="serviceList" style="width: 100%">
        <el-table-column prop="name" label="微服务名称" width="200" align="center" />
        <el-table-column prop="host" label="主机 IP" width="180" align="center" />
        <el-table-column prop="port" label="端口" width="120" align="center" />
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="scope">
            <el-tag type="success" v-if="scope.row.status === 'online'">在线</el-tag>
            <el-tag type="danger" v-else>离线</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内存占用 (MB)" align="center">
          <template #default="scope">
            {{ scope.row.memoryUsage ? (scope.row.memoryUsage / 1024 / 1024).toFixed(2) + ' MB' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="lastHeartbeat" label="最后心跳时间" align="center">
          <template #default="scope">
            {{ parseTime(scope.row.lastHeartbeat) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup name="Registry">
import { ref, onMounted, onUnmounted } from 'vue';
import { listOnlineServices } from '@/api/monitor/registry';
import { parseTime } from '@/utils/ruoyi';

const loading = ref(true);
const serviceList = ref([]);
let timer = null;

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
