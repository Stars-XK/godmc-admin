import { ref, onBeforeUnmount, watch } from 'vue'
import { io } from 'socket.io-client'

const WS_URL = (import.meta.env.VITE_APP_WS_URL) || 'http://localhost:3006'

export function useWebSocket(options = {}) {
  const { namespace = '/ws/water', autoConnect = true } = options

  const connected = ref(false)
  const lastBurstEvent = ref(null)
  const lastAlarm = ref(null)
  const burstEvents = ref([])
  const alarms = ref([])

  let socket = null

  function connect() {
    if (socket?.connected) return

    socket = io(`${WS_URL}${namespace}`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    })

    socket.on('connect', () => {
      connected.value = true
    })

    socket.on('disconnect', (_reason) => {
      connected.value = false
    })

    socket.on('connect_error', (_err) => {
      // silent — connected ref stays false
    })

    // 爆管事件
    socket.on('burst:new', (event) => {
      lastBurstEvent.value = event
      burstEvents.value.unshift(event)
      if (burstEvents.value.length > 50) burstEvents.value.length = 50
    })

    socket.on('burst:status', (data) => {
      const found = burstEvents.value.find(e => e.eventId === data.eventId)
      if (found) found.status = data.status
    })

    // 报警事件
    socket.on('alarm:new', (alarm) => {
      lastAlarm.value = alarm
      alarms.value.unshift(alarm)
      if (alarms.value.length > 50) alarms.value.length = 50
    })

    // 设备状态
    socket.on('device:status', () => {})
  }

  function disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
    }
    connected.value = false
  }

  function subscribeZone(zoneCode) {
    if (socket?.connected && zoneCode) {
      socket.emit('subscribe:zone', { zoneCode })
    }
  }

  function unsubscribeZone(zoneCode) {
    if (socket?.connected && zoneCode) {
      socket.emit('unsubscribe:zone', { zoneCode })
    }
  }

  // 当 zone 订阅变化时自动处理
  const subscribedZone = ref('')
  watch(subscribedZone, (newVal, oldVal) => {
    if (oldVal) unsubscribeZone(oldVal)
    if (newVal) subscribeZone(newVal)
  })

  if (autoConnect) {
    connect()
  }

  onBeforeUnmount(() => {
    disconnect()
  })

  return {
    connected,
    lastBurstEvent,
    lastAlarm,
    burstEvents,
    alarms,
    connect,
    disconnect,
    subscribeZone,
    unsubscribeZone,
    subscribedZone,
  }
}
