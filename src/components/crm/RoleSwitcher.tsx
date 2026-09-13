'use client'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  'crm-manager': 'CRM Manager',
  supervisor: 'Supervisor',
  'claims-officer': 'Claims Officer',
  'court-agent': 'Court Agent',
  'process-server': 'Process Server',
  collector: 'Collections',
  client: 'Client',
}

export function RoleSwitcher({
  roles,
  activeRole,
}: {
  roles: string[]
  activeRole: string | null
}) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value
    if (!roles.includes(newRole)) {
      console.error('Invalid role:', newRole)
      return
    }

    // Clear any previous cookie variants first
    document.cookie = 'activeRole=; path=/crm; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'activeRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'x-active-role=; path=/crm; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'x-active-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

    // Set the new value
    document.cookie = `x-active-role=${newRole}; path=/; SameSite=Lax`

    // Hard reload so server components pick up the new cookie
    window.location.reload()
  }

  if (roles.length <= 1) return null

  return (
    <select
      value={activeRole ?? ''}
      onChange={handleChange}
      className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white text-sm border border-slate-600 focus:ring-2 focus:ring-blue-500"
    >
      {roles.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABELS[role] ?? role}
        </option>
      ))}
    </select>
  )
}
