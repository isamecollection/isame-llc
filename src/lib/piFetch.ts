import { saveOfflineChange } from './offlineSync'

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // If online, try normal fetch
  if (navigator.onLine) {
    try {
      return await fetch(url, options)
    } catch (err) {
      // Network error even though we thought we were online
      console.warn('Network error, saving offline:', url)
    }
  }

  // Offline - save the change for later
  if (options.method && options.method !== 'GET') {
    const body = options.body ? JSON.parse(options.body as string) : {}
    await saveOfflineChange(url, options.method, body)

    // Return a fake success response so the UI doesn't break
    return new Response(JSON.stringify({ offline: true, queued: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // For GET requests, try cache
  const cache = await caches.open('isame-api-v1')
  const cached = await cache.match(url)
  if (cached) return cached

  return new Response(JSON.stringify({ error: 'Offline' }), { status: 503 })
}
