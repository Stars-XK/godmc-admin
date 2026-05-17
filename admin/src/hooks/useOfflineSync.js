import { ref, onBeforeUnmount } from 'vue'

/**
 * IndexedDB 离线队列 + Background Sync composable
 *
 * 离线时数据暂存 IndexedDB，恢复网络后自动批量同步。
 */

const DB_NAME = 'InspectionOfflineDB'
const DB_VERSION = 1
const STORE_RECORDS = 'pendingRecords'
const STORE_LOCATIONS = 'pendingLocations'
const STORE_PHOTOS = 'pendingPhotos'

// ---------- IndexedDB 工具 ----------

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        db.createObjectStore(STORE_RECORDS, { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains(STORE_LOCATIONS)) {
        db.createObjectStore(STORE_LOCATIONS, { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function addToStore(storeName, item) {
  const db = await openDB()
  const tx = db.transaction(storeName, 'readwrite')
  tx.objectStore(storeName).add({ ...item, _ts: Date.now() })
  return new Promise((resolve) => { tx.oncomplete = () => { db.close(); resolve() } })
}

async function getAllFromStore(storeName) {
  const db = await openDB()
  const tx = db.transaction(storeName, 'readonly')
  const items = await new Promise((resolve) => {
    const req = tx.objectStore(storeName).getAll()
    req.onsuccess = () => resolve(req.result)
  })
  db.close()
  return items
}

async function clearStore(storeName) {
  const db = await openDB()
  const tx = db.transaction(storeName, 'readwrite')
  tx.objectStore(storeName).clear()
  return new Promise((resolve) => { tx.oncomplete = () => { db.close(); resolve() } })
}

async function countStore(storeName) {
  const db = await openDB()
  const tx = db.transaction(storeName, 'readonly')
  const count = await new Promise((resolve) => {
    const req = tx.objectStore(storeName).count()
    req.onsuccess = () => resolve(req.result)
  })
  db.close()
  return count
}

// ---------- 公开 API ----------

/** 保存巡检记录到离线队列 */
export async function saveRecordToQueue(record) {
  await addToStore(STORE_RECORDS, record)
}

/** 保存 GPS 位置到离线队列 */
export async function saveLocationToQueue(point) {
  await addToStore(STORE_LOCATIONS, point)
}

/** 保存照片到离线队列（存储 base64/dataURL） */
export async function savePhotoToQueue(photo) {
  await addToStore(STORE_PHOTOS, photo)
}

/** 获取离线队列统计 */
export async function getQueueStats() {
  const [records, locations, photos] = await Promise.all([
    countStore(STORE_RECORDS),
    countStore(STORE_LOCATIONS),
    countStore(STORE_PHOTOS),
  ])
  return { records, locations, photos, total: records + locations + photos }
}

/** 获取所有待同步记录 */
export async function getPendingRecords() {
  return getAllFromStore(STORE_RECORDS)
}

/** 获取所有待同步位置 */
export async function getPendingLocations() {
  return getAllFromStore(STORE_LOCATIONS)
}

/** 获取所有待同步照片 */
export async function getPendingPhotos() {
  return getAllFromStore(STORE_PHOTOS)
}

/** 清空指定类型的离线队列 */
export async function clearQueue(storeName) {
  await clearStore(storeName || STORE_RECORDS)
}

/** 清空全部离线队列 */
export async function clearAllQueues() {
  await Promise.all([clearStore(STORE_RECORDS), clearStore(STORE_LOCATIONS), clearStore(STORE_PHOTOS)])
}

// ---------- Vue Composable ----------

export function useOfflineSync() {
  const syncing = ref(false)
  const queueStats = ref({ records: 0, locations: 0, photos: 0, total: 0 })
  const lastSyncResult = ref(null)

  let syncTimer = null

  async function syncAll() {
    if (syncing.value) return
    syncing.value = true

    try {
      // 动态导入 API 方法避免循环依赖
      const { batchUploadLocation } = await import('@/api/inspection/tracking')
      const { submitRecord } = await import('@/api/inspection/record')

      const locations = await getPendingLocations()
      const records = await getPendingRecords()

      let synced = 0
      const results = []

      // 同步 GPS 位置
      if (locations.length > 0) {
        try {
          const batch = locations.map(({ lng, lat, taskId, recordedAt, altitude, speed, heading, accuracy, _ts }) => ({
            lng: String(lng), lat: String(lat), taskId,
            recordedAt: recordedAt || new Date(_ts).toISOString(),
            altitude, speed, heading, accuracy,
          }))
          // 按 taskId 分组批量提交
          const groups = {}
          batch.forEach((p) => {
            if (!groups[p.taskId]) groups[p.taskId] = []
            groups[p.taskId].push(p)
          })
          for (const [taskId, points] of Object.entries(groups)) {
            await batchUploadLocation({ taskId: Number(taskId), points })
          }
          await clearStore(STORE_LOCATIONS)
          synced += locations.length
          results.push(`GPS轨迹 ×${locations.length}`)
        } catch (e) {
          console.error('GPS同步失败', e)
        }
      }

      // 同步巡检记录
      if (records.length > 0) {
        try {
          for (const r of records) {
            await submitRecord(r)
          }
          await clearStore(STORE_RECORDS)
          synced += records.length
          results.push(`巡检记录 ×${records.length}`)
        } catch (e) {
          console.error('记录同步失败', e)
        }
      }

      lastSyncResult.value = { synced, results, time: new Date() }
      await refreshQueueStats()
    } catch (e) {
      console.error('离线同步失败', e)
    } finally {
      syncing.value = false
    }
  }

  async function refreshQueueStats() {
    queueStats.value = await getQueueStats()
  }

  function startAutoSync(intervalMs = 30000) {
    syncTimer = setInterval(() => {
      if (navigator.onLine) syncAll()
    }, intervalMs)
    // 网络恢复时立即同步
    window.addEventListener('online', syncAll)
  }

  function stopAutoSync() {
    if (syncTimer) clearInterval(syncTimer)
    window.removeEventListener('online', syncAll)
  }

  onBeforeUnmount(stopAutoSync)

  return { syncing, queueStats, lastSyncResult, syncAll, refreshQueueStats, startAutoSync, stopAutoSync }
}
