// 智慧水务 — 巡检 PWA Service Worker
// 缓存策略: App Shell 预缓存 + API 请求 Network First + 静态资源 Cache First

const CACHE_VERSION = 'inspection-v1'
const APP_SHELL = 'app-shell-' + CACHE_VERSION
const STATIC_ASSETS = 'static-assets-' + CACHE_VERSION
const API_CACHE = 'api-cache-' + CACHE_VERSION

// App Shell 核心文件（首次安装时预缓存）
const SHELL_FILES = [
  '/',
  '/index.html',
  '/favicon.ico',
]

// 安装：预缓存 App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL).then((cache) => cache.addAll(SHELL_FILES))
  )
  self.skipWaiting()
})

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('inspection-') && k !== APP_SHELL && k !== STATIC_ASSETS && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// 请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过非 GET 请求
  if (request.method !== 'GET') return

  // API 请求: Network First, 失败时返回缓存（离线兜底）
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/inspection/')) {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  // JS/CSS/字体/图片: Cache First
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|png|jpg|jpeg|gif|svg|ico)$/) ||
    url.pathname.startsWith('/static/')
  ) {
    event.respondWith(cacheFirst(request, STATIC_ASSETS))
    return
  }

  // SPA 路由（HTML）: Network First
  event.respondWith(networkFirst(request, APP_SHELL))
})

// Network First 策略
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (e) {
    const cached = await caches.match(request)
    return cached || new Response(JSON.stringify({ code: -1, msg: '离线状态，数据不可用' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Cache First 策略
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (e) {
    return new Response('', { status: 408 })
  }
}

// 接收主线程消息
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
  }
})
