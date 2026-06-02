const CACHE_NAME = 'isame-crm-v3'
const API_CACHE = 'isame-api-v1'
const SYNC_QUEUE = 'isame-sync-queue'

// Pages to precache
const PRECACHE_URLS = [
  '/',
  '/crm/dashboard',
  '/crm/accounts',
  '/crm/login',
  '/crm/profile',
  '/manifest.json',
]

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)))
  self.skipWaiting()
})

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME && n !== API_CACHE).map((n) => caches.delete(n)),
      )
    }),
  )
  self.clients.claim()
})

// Fetch - Network first, cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and chrome extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(API_CACHE).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match(request)),
    )
    return
  }

  // Page requests - network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        return response
      })
      .catch(() => caches.match(request).then((r) => r || caches.match('/'))),
  )
})

// Listen for sync events when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-changes') {
    event.waitUntil(syncPendingChanges())
  }
})

// Process pending changes stored in IndexedDB
async function syncPendingChanges() {
  const db = await openSyncDB()
  const tx = db.transaction('changes', 'readonly')
  const store = tx.objectStore('changes')
  const changes = await store.getAll()

  for (const change of changes) {
    try {
      const response = await fetch(change.url, {
        method: change.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(change.body),
      })
      if (response.ok) {
        // Remove from queue on success
        const deleteTx = db.transaction('changes', 'readwrite')
        deleteTx.objectStore('changes').delete(change.id)
        await deleteTx.complete
      }
    } catch (err) {
      console.error('Sync failed for:', change.url, err)
    }
  }
}

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('IsameSyncDB', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('changes', { keyPath: 'id', autoIncrement: true })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
