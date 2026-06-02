'use client'
import { useEffect, useState } from 'react'
import { getPendingCount } from '@/lib/offlineSync'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    getPendingCount().then(setPendingCount)

    const handleOnline = async () => {
      setIsOffline(false)
      // Wait a moment for sync to happen
      setTimeout(async () => {
        const count = await getPendingCount()
        setPendingCount(count)
      }, 3000)
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline && pendingCount === 0) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 text-center py-1 text-sm font-medium ${
        isOffline ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
      }`}
    >
      {isOffline
        ? '📡 You are offline. Changes will sync when reconnected.'
        : `✅ Back online! ${pendingCount > 0 ? `Syncing ${pendingCount} pending change(s)...` : 'All synced!'}`}
    </div>
  )
}
