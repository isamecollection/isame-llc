'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function TeamList({ members }: { members: any[] }) {
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
    if (res.ok) showToast('Password reset')
    else showToast('Failed to reset password', 'error')
    setResetting(null)
  }

  if (members.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-3">Team Members</h2>
        <p className="text-gray-500 dark:text-gray-400">No team members yet.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mt-8 mb-3">Team Members</h2>
      <ul className="space-y-2">
        {members.map((m: any) => (
          <li
            key={m.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <strong className="text-gray-900 dark:text-gray-100">{m.name}</strong>{' '}
                <span className="text-gray-500 dark:text-gray-400">({m.email})</span>
              </div>
              <button
                onClick={() => resetPassword(m.id)}
                disabled={resetting === m.id}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {resetting === m.id ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
