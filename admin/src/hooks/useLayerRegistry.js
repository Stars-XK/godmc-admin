import { ref, shallowRef, watch } from 'vue'

/**
 * 图层注册中心
 *
 * 每个图层定义:
 * {
 *   key: string,
 *   label: string,
 *   color: string,
 *   minZoom: number,       // 低于此 zoom 自动隐藏
 *   maxZoom: number,       // 高于此 zoom 自动隐藏
 *   clusterGridSize?: number,
 *   clusterMaxZoom?: number,
 *   renderStrategy: 'polyline' | 'polygon' | 'markerCluster' | 'marker',
 *   fetchFn: (bbox?) => Promise<{ rows: any[] }>,
 *   renderFn: (data, map, AMap) => Overlay[],  // 返回 overlay 数组
 *   clearFn: (overlays) => void,
 * }
 *
 * @param {import('vue').Ref} mapRef - useAMap 返回的 map
 * @param {import('vue').Ref} amapRef - useAMap 返回的 AMap
 * @param {() => { swLng, swLat, neLng, neLat } | null} getBoundsFn
 */
export function useLayerRegistry(mapRef, amapRef, getBoundsFn) {
  const layers = shallowRef([])
  const layerMap = new Map()
  const overlayStore = new Map() // key → Overlay[]
  const abortControllers = new Map() // key → AbortController

  function register(def) {
    if (layerMap.has(def.key)) {
      console.warn(`[LayerRegistry] 图层 "${def.key}" 已注册，将覆盖`)
      unregister(def.key)
    }
    const layer = {
      ...def,
      visible: ref(def.visible !== false),
      loaded: ref(false),
      loading: ref(false),
      count: ref(0),
    }
    layerMap.set(def.key, layer)
    overlayStore.set(def.key, [])
    layers.value = [...layers.value, layer]

    // 监听可见性切换
    watch(layer.visible, (v) => {
      if (v) {
        showLayer(layer)
      } else {
        hideLayer(layer)
      }
    })

    return layer
  }

  function unregister(key) {
    const layer = layerMap.get(key)
    if (!layer) return
    // 清理 AbortController
    if (abortControllers.has(key)) {
      abortControllers.get(key).abort()
      abortControllers.delete(key)
    }
    // 清除 overlays
    hideLayer(layer)
    overlayStore.delete(key)
    layerMap.delete(key)
    layers.value = layers.value.filter(l => l.key !== key)
  }

  function getLayer(key) {
    return layerMap.get(key) || null
  }

  function toggle(key) {
    const layer = layerMap.get(key)
    if (layer) layer.visible.value = !layer.visible.value
  }

  function showLayer(layer) {
    const map = mapRef?.value
    if (!map) return
    const overlays = overlayStore.get(layer.key) || []
    if (layer.renderStrategy === 'markerCluster') {
      overlays.forEach(o => o.setMap(map))
    } else if (layer.renderStrategy === 'polyline' || layer.renderStrategy === 'polygon') {
      overlays.forEach(o => map.add(o))
    } else {
      overlays.forEach(o => map.add(o))
    }
  }

  function hideLayer(layer) {
    const map = mapRef?.value
    const overlays = overlayStore.get(layer.key) || []
    if (layer.renderStrategy === 'markerCluster') {
      overlays.forEach(o => o.setMap(null))
    } else {
      overlays.forEach(o => {
        try { map?.remove(o) } catch (e) { /* ignore */ }
      })
    }
  }

  async function refresh(key) {
    const layer = key ? layerMap.get(key) : null
    const targets = layer ? [layer] : layers.value

    for (const l of targets) {
      if (!l.visible.value) continue
      await fetchAndRender(l)
    }
  }

  async function fetchAndRender(layer) {
    const map = mapRef?.value
    const AMap = amapRef?.value
    if (!map || !AMap) return

    // 检查 zoom 范围
    const zoom = map.getZoom()
    if (zoom < (layer.minZoom || 0) || zoom > (layer.maxZoom || 24)) {
      hideLayer(layer)
      return
    }

    // 取消已有请求
    if (abortControllers.has(layer.key)) {
      abortControllers.get(layer.key).abort()
    }
    const ctrl = new AbortController()
    abortControllers.set(layer.key, ctrl)

    layer.loading.value = true
    try {
      const bbox = getBoundsFn?.()
      const res = await layer.fetchFn(bbox)
      if (ctrl.signal.aborted) return

      const rows = res?.rows || res?.data?.rows || res || []
      // 先清除旧 overlays
      await clearLayer(layer)

      const overlays = await layer.renderFn(rows, map, AMap)
      overlayStore.set(layer.key, overlays || [])
      layer.count.value = overlays?.length || 0
      layer.loaded.value = true
      showLayer(layer)
    } catch (e) {
      if (!ctrl.signal.aborted) {
        console.error(`[LayerRegistry] 刷新图层 "${layer.key}" 失败:`, e)
      }
    } finally {
      layer.loading.value = false
      abortControllers.delete(layer.key)
    }
  }

  async function clearLayer(layer) {
    hideLayer(layer)
    const overlays = overlayStore.get(layer.key) || []
    if (layer.clearFn) {
      await layer.clearFn(overlays)
    }
    overlayStore.set(layer.key, [])
    layer.count.value = 0
  }

  function refreshAll() {
    return refresh()
  }

  function getAllVisible() {
    const zoom = mapRef?.value?.getZoom() || 0
    return layers.value.filter(l => {
      return l.visible.value &&
        zoom >= (l.minZoom || 0) &&
        zoom <= (l.maxZoom || 24)
    })
  }

  /**
   * 连接 map 的 zoom 事件，自动处理层级可见性
   */
  function bindZoom(useAMapInstance) {
    if (!useAMapInstance) return
    useAMapInstance.onZoomChange((zoom) => {
      for (const layer of layers.value) {
        const inRange = zoom >= (layer.minZoom || 0) && zoom <= (layer.maxZoom || 24)
        if (layer.visible.value && inRange && !layer.loaded.value) {
          fetchAndRender(layer)
        } else if (!inRange && layer.loaded.value) {
          hideLayer(layer)
        }
      }
    })
  }

  function destroy() {
    for (const key of abortControllers.keys()) {
      abortControllers.get(key).abort()
    }
    abortControllers.clear()
    for (const layer of layers.value) {
      clearLayer(layer)
    }
    layerMap.clear()
    overlayStore.clear()
    layers.value = []
  }

  return {
    layers,
    register,
    unregister,
    getLayer,
    toggle,
    refresh,
    refreshAll,
    clearLayer,
    getAllVisible,
    fetchAndRender,
    bindZoom,
    destroy,
  }
}
