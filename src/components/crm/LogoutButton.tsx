'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' })
    } catch (e) {
      // Continue even if API call fails
    }

    // Clear the active role cookie
    document.cookie = 'activeRole=; path=/crm; expires=Thu, 01 Jan 1970 00:00:00 GMT'

    // Redirect to login
    router.push('/crm/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
    >
      🚪 Logout
    </button>
  )
}
