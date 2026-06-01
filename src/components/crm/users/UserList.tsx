'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

const ALL_ROLES = [
  'admin',
  'editor',
  'crm-manager',
  'supervisor',
  'court-agent',
  'process-server',
  'claims-officer',
  'collector',
  'client',
  'debtor',
]

export function UserList({
  users: initialUsers,
  supervisors,
  courtAgents,
}: {
  users: any[]
  supervisors: any[]
  courtAgents: any[]
}) {
  const [users, setUsers] = useState(initialUsers)
  const [editing, setEditing] = useState<string | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('')
  const [selectedCourtAgent, setSelectedCourtAgent] = useState<string>('')
  const [resetting, setResetting] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const startEditing = (user: any) => {
    setEditing(user.id)
    setSelectedRoles([...user.roles])
    setSelectedSupervisor(user.supervisor || '')
    setSelectedCourtAgent(user.courtAgentSupervisor || '')
  }

  const cancelEditing = () => {
    setEditing(null)
    setSelectedRoles([])
    setSelectedSupervisor('')
    setSelectedCourtAgent('')
  }

  const saveRoles = async (userId: string) => {
    setSaving(true)
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roles: selectedRoles,
        supervisor: selectedSupervisor || null,
        courtAgentSupervisor: selectedCourtAgent || null,
      }),
    })
    if (res.ok) {
      showToast('User updated')
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                roles: selectedRoles,
                supervisor: selectedSupervisor || null,
                courtAgentSupervisor: selectedCourtAgent || null,
              }
            : u,
        ),
      )
      cancelEditing()
    } else {
      showToast('Failed to update user', 'error')
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
      showToast('Failed to delete user', 'error')
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
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <span>Roles: {u.roles?.join(', ') || 'none'}</span>
                    {u.supervisor && (
                      <span className="ml-3">
                        Supervisor:{' '}
                        {typeof u.supervisor === 'object' ? u.supervisor.name : 'Assigned'}
                      </span>
                    )}
                    {u.courtAgentSupervisor && (
                      <span className="ml-3">
                        Court Agent:{' '}
                        {typeof u.courtAgentSupervisor === 'object'
                          ? u.courtAgentSupervisor.name
                          : 'Assigned'}
                      </span>
                    )}
                  </div>
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
                      Edit
                    </button>
                    <button
                      onClick={() => resetPassword(u.id)}
                      disabled={resetting === u.id}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {resetting === u.id ? 'Resetting…' : 'Reset'}
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
              <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {/* Roles */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Roles</p>
                  <div className="flex flex-wrap gap-3">
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
                </div>

                {/* Supervisor (for collectors) */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Supervisor
                  </p>
                  <select
                    value={selectedSupervisor}
                    onChange={(e) => setSelectedSupervisor(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="">-- none --</option>
                    {supervisors.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Court Agent Supervisor (for process servers) */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Court Agent (for Process Servers)
                  </p>
                  <select
                    value={selectedCourtAgent}
                    onChange={(e) => setSelectedCourtAgent(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="">-- none --</option>
                    {courtAgents.map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
