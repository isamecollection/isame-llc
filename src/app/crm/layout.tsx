import React from 'react'
import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { RoleProvider } from '@/context/RoleContext'
import { RoleSwitcher } from '@/components/crm/RoleSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MobileSidebar } from '@/components/crm/MobileSidebar'
import { QuickLogProvider } from '@/components/QuickLogProvider'
import { QuickLogPopup } from '@/components/QuickLogPopup'
import Link from 'next/link'

export default async function CrmRootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const cookieStore = await cookies()
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: headersList })

  const pathname = headersList.get('x-pathname') || ''
  if (!user || pathname === '/crm/login') {
    return <>{children}</>
  }

  const roles: string[] = user?.roles ?? []
  const activeRoleCookie = cookieStore.get('activeRole')?.value
  const activeRole = activeRoleCookie || roles[0] || null

  const showManagement = activeRole === 'crm-manager' || activeRole === 'admin'
  const showSupervisor = activeRole === 'supervisor' || activeRole === 'admin'
  const showReports = showManagement || showSupervisor || activeRole === 'admin'

  return (
    <RoleProvider initialRole={activeRole} roles={roles}>
      <QuickLogProvider>
        <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
          {/* Sidebar – desktop */}
          <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-800 dark:bg-slate-950 text-white p-4 pb-10 space-y-2 border-r border-slate-700">
            <h2 className="text-xl font-bold mb-4">CRM</h2>

            <NavLink href="/crm/dashboard">📊 Dashboard</NavLink>
            <NavLink href="/crm/accounts">📋 Accounts</NavLink>

            {showManagement && (
              <>
                <NavLink href="/crm/users">👥 Users</NavLink>
                <NavLink href="/crm/clients">🏢 Clients</NavLink>
                <NavLink href="/crm/import">➕ Add Accounts</NavLink>
              </>
            )}

            {showSupervisor && <NavLink href="/crm/supervisor/users">👥 Manage Team</NavLink>}
            {showReports && <NavLink href="/crm/reports">📊 Reports</NavLink>}

            <div className="flex-1" />

            <div className="border-t border-slate-700 pt-4 space-y-3 pb-16">
              <ThemeToggle />
              <RoleSwitcher roles={roles} activeRole={activeRole} />
              <p className="text-sm mt-2">{user.name}</p>
            </div>
          </aside>

          {/* Mobile sidebar */}
          <MobileSidebar
            showManagement={showManagement}
            showSupervisor={showSupervisor}
            showReports={showReports}
            roles={roles}
            activeRole={activeRole}
            userName={user.name || 'Unknown'}
          />

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>

        {/* Quick‑log popup – appears after phone/SMS/WhatsApp interactions */}
        <QuickLogPopup />
      </QuickLogProvider>
    </RoleProvider>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
    >
      {children}
    </Link>
  )
}
