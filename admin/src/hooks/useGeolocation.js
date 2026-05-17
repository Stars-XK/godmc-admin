import { ref, onBeforeUnmount } from 'vue'
import { uploadLocation } from '@/api/inspection/tracking'
import { saveLocationToQueue } from '@/hooks/useOfflineSync'

/**
 * GPS 定位 + 定时上报 composable
 *
 * @param {Object} options
 * @param {number} options.taskId - 当前任务ID
 * @param {number} options.interval - 上报间隔(秒)，默认10
 * @param {boolean} options.enableHighAccuracy - 高精度模式
 * @returns {{ watching, current, error, start, stop }}
 */
export function useGeolocation(options = {}) {
  const { taskId, interval = 10, enableHighAccuracy = true } = options

  const watching = ref(false)
  const current = ref(null)
  const error = ref(null)

  let watchId = null
  let uploadTimer = null

  function start() {
    if (!navigator.geolocation) {
      error.value = '设备不支持GPS定位'
      return
    }

    watching.value = true
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        current.value = {
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
          altitude: pos.coords.altitude || undefined,
          speed: (pos.coords.speed || 0) * 3.6, // m/s → km/h
          heading: pos.coords.heading || undefined,
          accuracy: pos.coords.accuracy,
        }
        error.value = null
      },
      (err) => {
        error.value = `定位失败: ${err.message}`
      },
      {
        enableHighAccuracy,
        timeout: 15000,
        maximumAge: 5000,
      }
    )

    // 定时上报
    uploadTimer = setInterval(() => {
      if (current.value && taskId) {
        const point = {
          ...current.value,
          taskId,
          recordedAt: new Date().toISOString(),
        }
        uploadLocation(point).catch(() => {
          // 网络失败 → 离线队列
          saveLocationToQueue(point)
        })
      }
    }, interval * 1000)
  }

  function stop() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
    if (uploadTimer) {
      clearInterval(uploadTimer)
      uploadTimer = null
    }
    watching.value = false
    current.value = null
  }

  onBeforeUnmount(() => stop())

  return { watching, current, error, start, stop }
}
