<template>
  <div
    class="gis-layer-panel"
    :class="[positionClass, { compact, collapsed }]"
  >
    <div class="panel-header" @click="collapsible && (collapsed = !collapsed)">
      <el-icon v-if="collapsible" class="collapse-icon" :class="{ open: !collapsed }">
        <ArrowRight />
      </el-icon>
      <span class="header-title">{{ collapsed && title ? title : (title || '图层控制') }}</span>
      <span v-if="!collapsed && !compact" class="header-hint">点击切换</span>
    </div>

    <div class="layer-list" v-show="!collapsed">
      <div
        class="layer-row"
        v-for="l in layers"
        :key="l.key"
        :class="{ active: l.visible.value }"
        @click="$emit('toggle', l.key)"
      >
        <span class="layer-dot" :style="{ background: l.color, boxShadow: `0 0 ${l.visible.value ? 10 : 4}px ${l.color}` }"></span>
        <span class="layer-name">{{ l.label }}</span>
        <span v-if="!compact" class="layer-zoom">{{ zoomLabel(l) }}</span>
        <span v-if="!compact && l.count.value > 0" class="layer-count">{{ l.count.value }}</span>
        <span class="layer-switch" :class="{ on: l.visible.value }"></span>
        <span v-if="l.loading.value" class="layer-spinner"><el-icon class="spin-icon"><Loading /></el-icon></span>
      </div>

      <div v-if="layers.length === 0" class="empty-hint">暂无可控制图层</div>
    </div>

    <!-- 完整模式: 图例 -->
    <div class="legend-section" v-if="!compact && !collapsed && layers.length > 0">
      <div class="legend-row" v-for="l in layers" :key="l.key + '-legend'">
        <span class="legend-dot" :style="{ background: l.color }"></span>
        <span class="legend-name">{{ l.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowRight, Loading } from '@element-plus/icons-vue'

const props = defineProps({
  layers: { type: Array, default: () => [] },
  position: { type: String, default: 'top-right' },
  title: { type: String, default: '' },
  collapsible: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
})

defineEmits(['toggle'])

const collapsed = ref(false)

const positionClass = `pos-${props.position}`

function zoomLabel(layer) {
  const min = layer.minZoom ?? '-'
  const max = layer.maxZoom ?? '-'
  if (min === '-' && max === '-') return '全层级'
  if (min === '-') return `≤${max}`
  if (max === '-') return `≥${min}`
  return `${min}-${max}级`
}
</script>

<style lang="scss" scoped>
.gis-layer-panel {
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  background: rgba(15, 23, 42, 0.7);
  position: relative;
  overflow: hidden;
  z-index: 100;
  user-select: none;

  &::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
    pointer-events: none;
  }

  &.compact {
    border-radius: 10px;
    .layer-row { padding: 6px 10px; }
    .layer-name { font-size: 11px; }
    .layer-switch { width: 28px; height: 16px;
      &::after { width: 10px; height: 10px; top: 3px; left: 3px; }
      &.on::after { transform: translateX(12px); }
    }
  }

  &.collapsed {
    .panel-header { margin-bottom: 0; }
  }
}

.panel-header {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: default;
}

.collapse-icon {
  font-size: 14px;
  color: #94A3B8;
  transition: transform 0.2s;
  &.open { transform: rotate(90deg); }
}

.header-title {
  font-size: 13px;
  font-weight: 600;
  color: #CBD5E1;
  flex: 1;
}

.header-hint {
  font-size: 10px;
  color: #64748B;
}

.layer-list {
  padding: 0 8px 8px;
}

.layer-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: rgba(255,255,255,0.04); }
  &.active { background: rgba(255,255,255,0.03); }
}

.layer-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}

.layer-name {
  flex: 1;
  font-size: 13px;
  color: #CBD5E1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-zoom {
  font-size: 10px;
  color: #64748B;
  background: rgba(255,255,255,0.06);
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.layer-count {
  font-size: 11px;
  color: #5EEAD4;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
}

.layer-switch {
  width: 36px; height: 20px; border-radius: 10px;
  background: rgba(255,255,255,0.12);
  transition: background 0.25s;
  position: relative;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute; top: 3px; left: 3px;
    width: 14px; height: 14px; border-radius: 50%;
    background: #fff; transition: transform 0.25s;
  }

  &.on {
    background: rgba(94, 234, 212, 0.5);
    &::after { transform: translateX(16px); }
  }
}

.layer-spinner { margin-left: 2px; }

.spin-icon { animation: spin 1s linear infinite; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-hint {
  font-size: 12px; color: #64748B; text-align: center; padding: 12px 0;
}

.legend-section {
  padding: 10px 14px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.legend-row {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; color: #94A3B8;
  padding: 3px 0;
}

.legend-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}

.legend-name { color: #CBD5E1; }

/* Position classes (for absolute positioning by parent) */
.pos-top-right   { }
.pos-top-left    { }
.pos-bottom-left { }
.pos-bottom-right { }
</style>
