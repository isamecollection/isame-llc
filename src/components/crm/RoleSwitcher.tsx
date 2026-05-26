'use client'

import { useState } from 'react'

export function RoleSwitcher({
  roles,
  activeRole,
}: {
  roles: string[]
  activeRole: string | null
}) {
  const [currentRole, setCurrentRole] = useState(activeRole ?? '')

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value
    setCurrentRole(newRole)
    document.cookie = `activeRole=${newRole}; path=/crm; SameSite=Lax`
    window.location.reload()
  }

  if (roles.length <= 1) return null

  return (
    <select
      value={currentRole}
      onChange={handleChange}
      className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white text-sm border border-slate-600 focus:ring-2 focus:ring-blue-500"
    >
      {roles.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  )
}
