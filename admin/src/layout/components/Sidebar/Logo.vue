<template>
  <div class="sidebar-logo-container" :class="{ collapse: collapse }">
    <router-link class="sidebar-logo-link" to="/">
      <img v-if="logo" :src="logo" class="sidebar-logo-img" alt="logo" />
      <div v-else class="sidebar-logo-icon">
        <svg viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="url(#sg)"/>
          <path d="M12 24c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          <circle cx="20" cy="24" r="2.5" fill="#fff"/>
          <defs><linearGradient id="sg" x1="0" y1="0" x2="40" y2="40"><stop offset="0%" stop-color="#14B8A6"/><stop offset="100%" stop-color="#0D9488"/></linearGradient></defs>
        </svg>
      </div>
      <span v-show="!collapse" class="sidebar-title">{{ displayTitle }}</span>
    </router-link>
  </div>
</template>

<script setup>
import logo from '@/assets/logo/logo.png'
import useSettingsStore from '@/store/modules/settings'

defineProps({
  collapse: { type: Boolean, required: true }
})

const settingsStore = useSettingsStore()
const displayTitle = computed(() => settingsStore.title || import.meta.env.VITE_APP_TITLE || '智慧水务')
</script>

<style lang="scss" scoped>
.sidebar-logo-container {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.3s;
}

.sidebar-logo-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  width: 100%;
  text-decoration: none;
  padding: 0 16px;
}

.sidebar-logo-img {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.sidebar-logo-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;

  svg {
    width: 100%;
    height: 100%;
  }
}

.sidebar-title {
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.03em;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-logo-container.collapse {
  .sidebar-logo-link {
    justify-content: center;
    padding: 0;
  }
}
</style>
