<template>
  <el-card shadow="never" class="dpp-card">
    <template #header>
      <div class="card-title">
        <el-icon><Grid /></el-icon>
        <span>{{ title }}</span>
      </div>
    </template>

    <div style="display:flex;gap:8px;margin-bottom:12px">
      <el-input v-model="searchKey" placeholder="搜索设备/测点" size="small" clearable style="flex:1" />
      <el-button text size="small" @click="Object.keys(collapsed).length ? expandAll() : collapseAll()">
        {{ Object.keys(collapsed).length ? '展开全部' : '收起全部' }}
      </el-button>
    </div>

    <div v-loading="loading" class="point-list">
      <div v-for="g in filteredGroups" :key="g.deviceCode" class="device-group">
        <div class="dg-header" @click="toggleGroup(g.deviceCode)">
          <el-icon class="dg-arrow" :class="{ collapsed: collapsed[g.deviceCode] }"><ArrowDown /></el-icon>
          <span class="dg-name">{{ g.deviceName }}</span>
          <el-tag size="small">{{ g.points.length }}个</el-tag>
        </div>
        <template v-for="p in g.points" :key="p.id || p.code">
          <div
            v-if="searchKey || !collapsed[g.deviceCode]"
            class="point-row"
            :class="{ active: isActive(p) }"
            @click="$emit('select', p)"
          >
            <div class="p-info">
              <span class="p-name">{{ p.name || p.code }}</span>
              <span class="p-type">{{ p.typeLabel }}</span>
            </div>
            <slot name="status" :point="p">
              <span class="p-status" :class="statusClass(p)"></span>
            </slot>
          </div>
        </template>
      </div>
      <div v-if="groups.length === 0 && !loading" class="empty-hint">{{ emptyText }}</div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Grid, ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  groups: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  title: { type: String, default: '设备监测点' },
  emptyText: { type: String, default: '暂无数据' },
  selectedId: { type: [Number, String], default: null },
  statusFn: { type: Function, default: null },
})

defineEmits(['select'])

const searchKey = ref('')
const collapsed = ref({})

function toggleGroup(code) { collapsed.value[code] = !collapsed.value[code] }
function collapseAll() { props.groups.forEach(g => { collapsed.value[g.deviceCode] = true }) }
function expandAll() { collapsed.value = {} }

function isActive(p) {
  if (props.selectedId && p.id === props.selectedId) return true
  return false
}

function statusClass(p) {
  if (props.statusFn) return props.statusFn(p)
  return ''
}

const filteredGroups = computed(() => {
  if (!searchKey.value) return props.groups
  const kw = searchKey.value.toLowerCase()
  return props.groups
    .map(g => ({
      ...g,
      points: g.points.filter(p =>
        (p.name || '').toLowerCase().includes(kw) ||
        (p.code || '').toLowerCase().includes(kw) ||
        (g.deviceName || '').toLowerCase().includes(kw)
      ),
    }))
    .filter(g => g.points.length > 0 || g.deviceName.toLowerCase().includes(kw))
})
</script>

<style lang="scss" scoped>
.dpp-card {
  border-radius: 10px; border: 1px solid #E2E8F0; box-shadow: none; margin-bottom: 0; height: 100%;
}
.card-title {
  display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #0F172A;
  .el-icon { color: #0D9488; }
}
.point-list { max-height: calc(100vh - 320px); overflow-y: auto; }
.device-group { margin-bottom: 10px; }
.dg-header {
  display: flex; align-items: center; gap: 4px; padding: 4px 0;
  border-bottom: 1px solid #F1F5F9; margin-bottom: 3px; cursor: pointer; user-select: none;
}
.dg-arrow { font-size: 12px; color: #94A3B8; transition: transform .2s; flex-shrink: 0; }
.dg-arrow.collapsed { transform: rotate(-90deg); }
.dg-name { font-size: 13px; font-weight: 600; color: #475569; flex: 1; }
.dg-header :deep(.el-tag) {
  --el-tag-bg-color: rgba(13,148,136,.1);
  --el-tag-text-color: #0D9488;
  --el-tag-border-color: rgba(13,148,136,.2);
}
.point-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 10px; border-radius: 6px; cursor: pointer; margin: 2px 0; border: 1px solid transparent;
  transition: all .15s;
  &:hover { background: #F0FDFA; }
  &.active { background: #F0FDFA; border-color: #0D9488; }
}
.p-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.p-name { font-size: 13px; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.p-type {
  font-size: 11px; color: #64748B; background: #F8FAFC; border: 1px solid #E2E8F0;
  border-radius: 4px; padding: 1px 6px; align-self: flex-start; margin-top: 2px;
}
.p-status { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-left: 8px; }
.p-status.ok { background: #10B981; }
.p-status.warn { background: #F59E0B; }
.p-status.bad { background: #EF4444; }
.p-status.unknown { background: #CBD5E1; }
.empty-hint { text-align: center; color: #94A3B8; font-size: 13px; padding: 24px 0; }
</style>
