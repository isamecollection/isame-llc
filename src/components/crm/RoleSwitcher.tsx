'use client'

export function RoleSwitcher({
  roles,
  activeRole,
}: {
  roles: string[]
  activeRole: string | null
}) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value
    document.cookie = 'x-active-role=' + newRole + '; path=/; SameSite=Lax'
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
          {role}
        </option>
      ))}
    </select>
  )
}