<template>
  <div class="refined-card">
    <div class="card-header">
      <div class="card-title-group">
        <h3 class="card-title">{{ config.configName }}</h3>
        <span class="card-badge" :class="config.configType === 'Y' ? 'badge-system' : 'badge-custom'">
          {{ config.configType === 'Y' ? '系统内置' : '自定义' }}
        </span>
      </div>
      <div class="card-actions">
        <button class="action-btn" @click="$emit('edit', config)" v-hasPermi="['system:config:edit']" title="编辑">
          <el-icon><Edit /></el-icon>
        </button>
        <button class="action-btn text-danger" @click="$emit('delete', config)" v-hasPermi="['system:config:remove']" v-if="config.configType !== 'Y'" title="删除">
          <el-icon><Delete /></el-icon>
        </button>
      </div>
    </div>
    
    <div class="card-body">
      <div class="info-row">
        <span class="info-label">键名</span>
        <div class="info-value key-value" @click="copyText(config.configKey)">
          <code>{{ config.configKey }}</code>
          <el-icon class="copy-icon"><CopyDocument /></el-icon>
        </div>
      </div>
      <div class="info-row">
        <span class="info-label">键值</span>
        <div class="info-value text-value" :title="config.configValue">
          {{ config.configValue }}
        </div>
      </div>
    </div>
    
    <div class="card-footer" v-if="config.remark">
      <p class="remark-text">{{ config.remark }}</p>
    </div>
  </div>
</template>

<script setup>
import { useClipboard } from '@vueuse/core'
import { ElMessage } from 'element-plus'

defineProps({
  config: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'delete'])

const { copy } = useClipboard()

async function copyText(text) {
  try {
    await copy(text)
    ElMessage.success('键名已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}
</script>

<style lang="scss" scoped>
.refined-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  
  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  
  .card-title-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .card-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      line-height: 1.4;
    }
    
    .card-badge {
      align-self: flex-start;
      font-size: 12px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 6px;
      letter-spacing: 0.02em;
      
      &.badge-system {
        background-color: #fee2e2;
        color: #b91c1c;
      }
      
      &.badge-custom {
        background-color: #f3f4f6;
        color: #4b5563;
      }
    }
  }
  
  .card-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    
    .action-btn {
      background: transparent;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      &:hover {
        background-color: #f3f4f6;
        color: #111827;
      }
      
      &.text-danger:hover {
        background-color: #fee2e2;
        color: #dc2626;
      }
    }
  }
}

.refined-card:hover .card-actions {
  opacity: 1;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-grow: 1;
  
  .info-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .info-value {
      font-size: 14px;
      color: #111827;
      line-height: 1.6;
    }
    
    .key-value {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      
      code {
        font-family: 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', Consolas, monospace;
        font-size: 13px;
        color: #374151;
        word-break: break-all;
      }
      
      .copy-icon {
        color: #9ca3af;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.2s;
        margin-left: auto;
      }
      
      &:hover {
        background-color: #f3f4f6;
        border-color: #d1d5db;
        
        .copy-icon {
          opacity: 1;
        }
      }
    }
    
    .text-value {
      background-color: #ffffff;
      border: 1px solid transparent;
      padding: 0;
      word-break: break-all;
    }
  }
}

.card-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #e5e7eb;
  
  .remark-text {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
    line-height: 1.5;
    /* Remove line clamp to show full text */
  }
}
</style>
