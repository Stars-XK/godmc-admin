/**
 * 主题初始化模块
 * 在应用启动时从系统配置 API 加载用户保存的主题/标题设置，
 * 解决"保存到数据库但从不加载"的问题。
 */
import { listConfig } from '@/api/system/config'
import { handleThemeStyle } from '@/utils/theme'
import useSettingsStore from '@/store/modules/settings'

// 需要加载的配置键及其处理函数
const THEME_CONFIG_KEYS = [
  'sys.web.siteName',
  'sys.web.title',
  'sys.web.primaryColor',
  'sys.index.skinName',
  'sys.index.sideTheme',
  'sys.index.siteTheme',
]

/**
 * 从系统配置 API 加载主题设置，覆盖本地默认值和 localStorage
 * 应在 App.vue onMounted 中调用
 */
export async function loadThemeFromConfig() {
  const settingsStore = useSettingsStore()

  try {
    const res = await listConfig({ pageSize: 500 })
    const list = res.rows || (res.data && res.data.rows) || (res.data && res.data.list) || (Array.isArray(res.data) ? res.data : [])

    const configMap = {}
    list.forEach(item => {
      configMap[item.configKey] = item.configValue
    })

    // 1. 应用系统名称
    if (configMap['sys.web.siteName']) {
      settingsStore.setTitle(configMap['sys.web.siteName'])
    }

    // 2. 应用网页标题
    if (configMap['sys.web.title']) {
      document.title = configMap['sys.web.title']
    }

    // 3. 应用主色调
    const primaryColor = configMap['sys.web.primaryColor']
    if (primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      settingsStore.changeSetting({ key: 'theme', value: primaryColor })
      handleThemeStyle(primaryColor)
    } else if (!primaryColor) {
      // 首次启动时使用默认 IoT 主题色
      const defaultColor = '#0D9488'
      settingsStore.changeSetting({ key: 'theme', value: defaultColor })
      handleThemeStyle(defaultColor)
    }

    // 4. 应用侧边栏主题
    const sideTheme = configMap['sys.index.sideTheme']
    if (sideTheme && (sideTheme === 'theme-dark' || sideTheme === 'theme-light')) {
      settingsStore.changeSetting({ key: 'sideTheme', value: sideTheme })
    }

    // 4.5. 应用全站主题（亮色/暗色）
    const siteTheme = configMap['sys.index.siteTheme']
    if (siteTheme && (siteTheme === 'light' || siteTheme === 'dark')) {
      settingsStore.changeSetting({ key: 'siteTheme', value: siteTheme })
    }

    // 5. 应用全局皮肤（预置色板映射）
    const skinName = configMap['sys.index.skinName']
    if (skinName) {
      const skinColorMap = {
        'skin-blue': '#0D9488',
        'skin-green': '#10B981',
        'skin-purple': '#8B5CF6',
        'skin-red': '#EF4444',
        'skin-yellow': '#F59E0B',
      }
      const color = skinColorMap[skinName]
      if (color && !configMap['sys.web.primaryColor']) {
        // 仅在没有单独设置主色调时，皮肤才覆盖
        settingsStore.changeSetting({ key: 'theme', value: color })
        handleThemeStyle(color)
      }
    }

    console.log('[ThemeInit] 主题配置已从系统配置加载', {
      siteName: configMap['sys.web.siteName'],
      primaryColor: settingsStore.theme,
      sideTheme: settingsStore.sideTheme,
    })
  } catch (error) {
    // 加载失败时使用默认 IoT 主题色
    console.warn('[ThemeInit] 无法加载系统配置，使用默认主题', error.message)
    const defaultColor = '#0D9488'
    if (!settingsStore.theme || settingsStore.theme === '#409EFF') {
      settingsStore.changeSetting({ key: 'theme', value: defaultColor })
      handleThemeStyle(defaultColor)
    }
  }
}
