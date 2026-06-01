'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function TeamList({ members }: { members: any[] }) {
  const [resetting, setResetting] = useState<string | null>(null)
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const { showToast } = useToast()

  async function resetPassword() {
    if (!newPassword || !resetUserId) return
    setResetting(resetUserId)
    const res = await fetch('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: resetUserId, newPassword }),
    })
    if (res.ok) {
      showToast('Password reset successfully')
      setResetUserId(null)
      setNewPassword('')
    } else {
      showToast('Failed to reset password', 'error')
    }
    setResetting(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team Members</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-full">
          {members.length}
        </span>
      </div>

      {members.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
          No team members yet. Add a collector above.
        </p>
      ) : (
        <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((m: any) => (
                <tr
                  key={m.id}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{m.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">{m.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {m.email}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setResetUserId(m.id)}
                      disabled={resetting === m.id}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {resetting === m.id ? 'Resetting…' : '🔑 Reset Password'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resetUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setResetUserId(null)
              setNewPassword('')
            }}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Reset Password
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Enter a new password for this team member.
            </p>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && resetPassword()}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setResetUserId(null)
                  setNewPassword('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={resetPassword}
                disabled={!newPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
