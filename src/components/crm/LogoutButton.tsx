'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' })
    } catch {
      // Continue even if API call fails
    }

    // Clear ALL cookie variants — both old names AND both paths
    const expired = '; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
    document.cookie = `activeRole=; path=/crm${expired}`
    document.cookie = `activeRole=; path=/${expired}`
    document.cookie = `x-active-role=; path=/crm${expired}`
    document.cookie = `x-active-role=; path=/${expired}`

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
