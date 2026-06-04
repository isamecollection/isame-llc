'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'

type Supervisor = {
  id: string
  name: string
}

export function CreateUserForm({ supervisors }: { supervisors: any[] }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [supervisorId, setSupervisorId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { showToast } = useToast()

  const roleOptions = [
    'collector',
    'supervisor',
    'crm-manager',
    'court-agent',
    'process-server',
    'claims-officer',
  ]

  const toggleRole = (role: string) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (roles.length === 0) {
      showToast('Please select at least one role', 'error')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          roles,
          supervisor: supervisorId || undefined,
        }),
      })

      if (response.ok) {
        showToast('User created')

        // Reset form
        setName('')
        setEmail('')
        setPassword('')
        setRoles([])
        setSupervisorId('')

        // Optional
        window.location.reload()
      } else {
        const error = await response.text()
        console.error(error)
        showToast('Failed to create user', 'error')
      }
    } catch (error) {
      console.error(error)
      showToast('Something went wrong', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 space-y-4">
      <h3 className="text-lg font-semibold">Create User</h3>

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Roles
        </label>

        <div className="flex flex-wrap gap-3">
          {roleOptions.map((role) => (
            <label
              key={role}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <input
                type="checkbox"
                checked={roles.includes(role)}
                onChange={() => toggleRole(role)}
              />
              {role}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Supervisor
        </label>

        <select
          value={supervisorId}
          onChange={(e) => setSupervisorId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">-- none --</option>

          {supervisors.map((supervisor) => (
            <option key={supervisor.id} value={supervisor.id}>
              {supervisor.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}
