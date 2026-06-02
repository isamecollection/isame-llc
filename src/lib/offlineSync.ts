// Save a change to IndexedDB for later sync
export async function saveOfflineChange(url: string, method: string, body: any) {
  const db = await openDB()

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('changes', 'readwrite')
    const store = tx.objectStore('changes')
    store.add({
      url,
      method,
      body,
      timestamp: new Date().toISOString(),
    })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Get pending changes count
export async function getPendingCount(): Promise<number> {
  const db = await openDB()

  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction('changes', 'readonly')
    const store = tx.objectStore('changes')
    const request = store.count()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Get all pending changes
export async function getPendingChanges(): Promise<any[]> {
  const db = await openDB()

  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction('changes', 'readonly')
    const store = tx.objectStore('changes')
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('IsameSyncDB', 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('changes')) {
        request.result.createObjectStore('changes', { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
