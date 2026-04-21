<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="总览拓扑" name="overview">
        <OverviewTab />
      </el-tab-pane>
      <el-tab-pane label="站点管理" name="station">
        <StationTab v-if="activeTab === 'station'" />
      </el-tab-pane>
      <el-tab-pane label="设备管理" name="device">
        <DeviceTab v-if="activeTab === 'device'" />
      </el-tab-pane>
      <el-tab-pane label="测点管理" name="point">
        <PointTab v-if="activeTab === 'point'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="StationDevicePoint">
import { ref } from 'vue'
import OverviewTab from './components/OverviewTab.vue'
import StationTab from './components/StationTab.vue'
import DeviceTab from './components/DeviceTab.vue'
import PointTab from './components/PointTab.vue'

const activeTab = ref('overview')
</script>

<style scoped>
.app-container {
  padding: 20px;
  height: calc(100vh - 84px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__content) {
  flex: 1;
  padding: 15px;
  overflow: hidden;
}

:deep(.el-tab-pane) {
  height: 100%;
}
</style>
