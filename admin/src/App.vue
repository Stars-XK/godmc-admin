<template>
  <router-view />
</template>

<script setup>
import useSettingsStore from '@/store/modules/settings'
import { handleThemeStyle } from '@/utils/theme'
import { loadThemeFromConfig } from '@/utils/themeInit'

onMounted(() => {
  nextTick(async () => {
    // 先从 localStorage 恢复上次保存的主题（快速首屏）
    const savedTheme = useSettingsStore().theme
    if (savedTheme) {
      handleThemeStyle(savedTheme)
    }

    // 再从系统配置 API 加载（覆盖 localStorage，确保与数据库一致）
    await loadThemeFromConfig()
  })
})
</script>
