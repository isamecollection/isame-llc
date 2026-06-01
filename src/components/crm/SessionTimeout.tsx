'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const TIMEOUT_MINUTES = 30

export function SessionTimeout() {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showWarning, setShowWarning] = useState(false)

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShowWarning(false)

    // Warn at 28 minutes
    timeoutRef.current = setTimeout(
      () => {
        setShowWarning(true)
      },
      (TIMEOUT_MINUTES - 2) * 60 * 1000,
    )

    // Logout at 30 minutes
    timeoutRef.current = setTimeout(
      () => {
        handleLogout()
      },
      TIMEOUT_MINUTES * 60 * 1000,
    )
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' })
    } catch {}
    document.cookie = 'activeRole=; path=/crm; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'payload-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/crm/login')
  }

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((event) => window.addEventListener(event, resetTimer))
    resetTimer()
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer))
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return showWarning ? (
    <div className="fixed bottom-4 right-4 z-50 bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4 shadow-lg max-w-sm">
      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
        ⚠️ Session expiring soon due to inactivity.
      </p>
      <button
        onClick={resetTimer}
        className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
      >
        Keep Working
      </button>
    </div>
  ) : null
}
