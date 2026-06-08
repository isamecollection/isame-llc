'use client'
import { useEffect } from 'react'

const ROLE_PRIORITY = [
  'admin',
  'crm-manager',
  'supervisor',
  'claims-officer',
  'court-agent',
  'process-server',
  'collector',
]

export function ActiveRoleFix({
  roles,
  currentCookie,
}: {
  roles: string[]
  currentCookie?: string
}) {
  useEffect(() => {
    const correctRole = ROLE_PRIORITY.find((r) => roles.includes(r)) || 'collector'
    if (currentCookie && currentCookie !== correctRole && !roles.includes(currentCookie || '')) {
      // Cookie is set to a role the user doesn't have - fix it
      document.cookie = `activeRole=${correctRole}; path=/crm; SameSite=Lax`
    }
  }, [roles, currentCookie])

  return null
}
