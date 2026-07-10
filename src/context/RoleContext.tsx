'use client'
import React, { createContext, useContext, useState, useCallback } from 'react'

type RoleContextType = {
  activeRole: string | null
  setActiveRole: (role: string) => void
  availableRoles: string[]
}

const RoleContext = createContext<RoleContextType>({
  activeRole: null,
  setActiveRole: () => {},
  availableRoles: [],
})

export function RoleProvider({
  children,
  initialRole,
  roles,
}: {
  children: React.ReactNode
  initialRole: string | null
  roles: string[]
}) {
  const [activeRole, setActiveRoleState] = useState<string | null>(initialRole)

  const setActiveRole = useCallback(
    (role: string) => {
      // 🔍 See what's happening
      console.log('setActiveRole called with:', role)

      // Remove old cookies
      document.cookie =
        'activeRole=; path=/crm; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
      document.cookie =
        'activeRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'

      // Set the new cookie
      document.cookie = `x-active-role=${role}; path=/; SameSite=Lax`

      console.log('document.cookie after set:', document.cookie)

      setActiveRoleState(role)
    },
    [],
  )

  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole, availableRoles: roles }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}