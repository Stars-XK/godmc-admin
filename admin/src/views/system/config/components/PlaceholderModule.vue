<template>
  <div class="placeholder-module">
    <div class="module-icon-bg">
      <el-icon><component :is="icon" /></el-icon>
    </div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <button class="btn-secondary" @click="handleAction">{{ buttonText }}</button>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'

defineProps({
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    required: true
  }
})

function handleAction() {
  ElMessage.info('该功能模块的UI已就绪，等待接入实际的API端点')
}
</script>

<style lang="scss" scoped>
.placeholder-module {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  text-align: center;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  min-height: 400px;
  
  .module-icon-bg {
    width: 64px;
    height: 64px;
    background: #f3f4f6;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    
    .el-icon {
      font-size: 32px;
      color: #4b5563;
    }
  }
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 12px 0;
  }
  
  p {
    color: #6b7280;
    max-width: 400px;
    line-height: 1.6;
    margin: 0 0 32px 0;
  }
}

.btn-secondary {
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0 24px;
  height: 44px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }
}
</style>
