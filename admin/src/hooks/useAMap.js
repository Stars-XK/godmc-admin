import { ref, shallowRef } from 'vue'
import { getConfigKey } from '@/api/system/config'
import AMapLoader from '@amap/amap-jsapi-loader'

// 全局单例状态
let mapInstance = null
let AMapNS = null
let refCount = 0
let loadedPlugins = new Set()
const configCache = { key: null, security: null, style: null, center: null, zoom: null }
let configLoaded = false

const zoomListeners = []
let zoomDebounceTimer = null

async function loadConfig() {
  if (configLoaded) return configCache
  const [keyRes, securityRes, styleRes, centerRes, zoomRes] = await Promise.all([
    getConfigKey('gis.map.amap.key'),
    getConfigKey('gis.map.amap.security'),
    getConfigKey('gis.map.style'),
    getConfigKey('gis.map.center'),
    getConfigKey('gis.map.zoom'),
  ])
  configCache.key = keyRes?.data || ''
  configCache.security = securityRes?.data || ''
  configCache.style = styleRes?.data || 'amap://styles/light'
  configCache.center = centerRes?.data || ''
  configCache.zoom = zoomRes?.data || ''
  configLoaded = true
  return configCache
}

async function ensureAMap(plugins = []) {
  const config = await loadConfig()
  if (!config.key) {
    console.warn('[useAMap] 未配置高德地图Key (gis.map.amap.key)')
    return null
  }

  const newPlugins = plugins.filter(p => !loadedPlugins.has(p))
  if (newPlugins.length > 0) {
    newPlugins.forEach(p => loadedPlugins.add(p))
  }

  const allPlugins = [...loadedPlugins]
  if (allPlugins.length === 0) {
    allPlugins.push('AMap.Marker')
  }

  if (config.security) {
    window._AMapSecurityConfig = { securityJsCode: config.security }
  }

  AMapNS = await AMapLoader.load({
    key: config.key,
    version: '2.0',
    plugins: allPlugins,
  })
  window.AMap = AMapNS
  return AMapNS
}

function parseCenter(centerStr) {
  if (!centerStr) return [118.6, 24.9]
  const parts = centerStr.split(',').map(Number)
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts
  }
  return [118.6, 24.9]
}

function parseZoom(zoomStr) {
  const z = Number(zoomStr)
  return !isNaN(z) && z >= 3 && z <= 20 ? z : 12
}

function isDarkStyle(style) {
  return !style || style.includes('dark')
}

/**
 * 共享高德地图 composable
 *
 * @param {Object} options
 * @param {string[]} options.plugins - 需要的 AMap 插件列表
 * @returns {{ map, loaded, AMap, init, getBounds, getZoom, onZoomChange, destroy }}
 */
export function useAMap(options = {}) {
  const { plugins = [] } = options
  const map = shallowRef(null)
  const loaded = ref(false)
  const AMap = shallowRef(null)

  async function init(containerEl) {
    if (mapInstance) {
      refCount++
      map.value = mapInstance
      AMap.value = AMapNS
      loaded.value = true
      return mapInstance
    }

    const amap = await ensureAMap(plugins)
    if (!amap) return null
    AMap.value = amap

    const center = parseCenter(configCache.center)
    const zoom = parseZoom(configCache.zoom)
    const mapStyle = configCache.style

    mapInstance = new amap.Map(containerEl, {
      zoom,
      center,
      mapStyle,
      viewMode: '2D',
      resizeEnable: true,
    })

    // 缩放层级通知
    mapInstance.on('zoomend', () => {
      if (zoomDebounceTimer) clearTimeout(zoomDebounceTimer)
      zoomDebounceTimer = setTimeout(() => {
        const z = mapInstance.getZoom()
        zoomListeners.forEach(fn => fn(z))
      }, 300)
    })

    refCount = 1
    map.value = mapInstance
    loaded.value = true
    return mapInstance
  }

  function getBounds() {
    if (!mapInstance) return null
    const bounds = mapInstance.getBounds()
    return {
      swLng: bounds.getSouthWest().lng,
      swLat: bounds.getSouthWest().lat,
      neLng: bounds.getNorthEast().lng,
      neLat: bounds.getNorthEast().lat,
    }
  }

  function getZoom() {
    return mapInstance ? mapInstance.getZoom() : 0
  }

  function onZoomChange(fn) {
    zoomListeners.push(fn)
    return () => {
      const idx = zoomListeners.indexOf(fn)
      if (idx >= 0) zoomListeners.splice(idx, 1)
    }
  }

  function destroy() {
    if (refCount > 0) refCount--
    // 最后一个使用者才真正销毁
    if (refCount === 0 && mapInstance) {
      if (zoomDebounceTimer) clearTimeout(zoomDebounceTimer)
      zoomListeners.length = 0
      mapInstance.destroy()
      mapInstance = null
      AMapNS = null
      loadedPlugins.clear()
    }
    map.value = null
    loaded.value = false
  }

  return { map, loaded, AMap, init, getBounds, getZoom, onZoomChange, destroy }
}

/** 仅获取配置（不加载地图） */
export async function getAMapConfig() {
  return loadConfig()
}

/** 判断样式是否为暗色 */
export { isDarkStyle }
