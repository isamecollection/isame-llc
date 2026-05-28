'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

const ALL_ROLES = [
  'admin',
  'editor',
  'crm-manager',
  'supervisor',
  'court-agent',
  'collector',
  'client',
  'debtor',
]

export function UserList({ users: initialUsers }: { users: any[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [editing, setEditing] = useState<string | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [resetting, setResetting] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const startEditing = (user: any) => {
    setEditing(user.id)
    setSelectedRoles([...user.roles])
  }

  const cancelEditing = () => {
    setEditing(null)
    setSelectedRoles([])
  }

  const saveRoles = async (userId: string) => {
    setSaving(true)
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: selectedRoles }),
    })
    if (res.ok) {
      showToast('Roles updated')
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, roles: selectedRoles } : u)))
      cancelEditing()
    } else {
      showToast('Failed to update roles', 'error')
    }
    setSaving(false)
  }

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    )
  }

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

  async function deleteUser(userId: string) {
    if (!confirm('Are you sure you want to permanently delete this user? This cannot be undone.'))
      return
    setDeleting(userId)
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('User deleted')
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } else {
      showToast('Failed to delete user. Only admins and CRM managers can delete users.', 'error')
    }
    setDeleting(null)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Users</h2>
      <ul className="space-y-2">
        {users.map((u: any) => (
          <li
            key={u.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <strong className="text-gray-900 dark:text-gray-100">{u.name}</strong>{' '}
                <span className="text-gray-500 dark:text-gray-400">({u.email})</span>
                {editing !== u.id && (
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                    – Roles: {u.roles?.join(', ')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {editing === u.id ? (
                  <>
                    <button
                      onClick={() => saveRoles(u.id)}
                      disabled={saving}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEditing(u)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit Roles
                    </button>
                    <button
                      onClick={() => resetPassword(u.id)}
                      disabled={resetting === u.id}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {resetting === u.id ? 'Resetting…' : 'Reset Password'}
                    </button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      disabled={deleting === u.id}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deleting === u.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {editing === u.id && (
              <div className="mt-3 flex flex-wrap gap-3">
                {ALL_ROLES.map((role) => (
                  <label
                    key={role}
                    className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    {role}
                  </label>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
