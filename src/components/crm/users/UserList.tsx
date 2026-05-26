'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function UserList({ users }: { users: any[] }) {
  const [resetting, setResetting] = useState<string | null>(null)
  const { showToast } = useToast()

  async function resetPassword(userId: string) {
    const newPass = prompt('Enter new password:')
    if (!newPass) return
    setResetting(userId)
    const res = await fetch('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword: newPass }),
    })
    if (res.ok) {
      showToast('Password reset')
    } else {
      showToast('Failed to reset password', 'error')
    }
    setResetting(null)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Users</h2>
      <ul className="space-y-2">
        {users.map((u: any) => (
          <li
            key={u.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div>
              <strong className="text-gray-900 dark:text-gray-100">{u.name}</strong>{' '}
              <span className="text-gray-500 dark:text-gray-400">({u.email})</span>
              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                – Roles: {u.roles?.join(', ')}
              </span>
            </div>
            <button
              onClick={() => resetPassword(u.id)}
              disabled={resetting === u.id}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {resetting === u.id ? 'Resetting…' : 'Reset Password'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
