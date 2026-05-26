'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

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
  const [activeRole, setActiveRole] = useState<string | null>(initialRole)

  // Keep the cookie in sync with state (optional, but good practice)
  useEffect(() => {
    if (activeRole) {
      document.cookie = `activeRole=${activeRole}; path=/crm; SameSite=Lax`
    }
  }, [activeRole])

  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole, availableRoles: roles }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
