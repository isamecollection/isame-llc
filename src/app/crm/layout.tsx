import React from 'react'
import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { RoleProvider } from '@/context/RoleContext'
import { RoleSwitcher } from '@/components/crm/RoleSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MobileSidebar } from '@/components/crm/MobileSidebar'
import { QuickLogProvider } from '@/components/QuickLogProvider'
import { QuickLogPopup } from '@/components/QuickLogPopup'
import { LogoutButton } from '@/components/crm/LogoutButton'
import { SessionTimeout } from '@/components/crm/SessionTimeout'
import { OfflineIndicator } from '@/components/crm/OfflineIndicator'
import Link from 'next/link'

const ROLE_PRIORITY = [
  'admin',
  'crm-manager',
  'supervisor',
  'claims-officer',
  'court-agent',
  'process-server',
  'collector',
]

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

  // Always use the highest priority role, ignore cookie if it's wrong
  const correctRole = ROLE_PRIORITY.find((r) => roles.includes(r)) || roles[0] || 'collector'
  const activeRole = correctRole

  const showManagement = activeRole === 'crm-manager' || activeRole === 'admin'
  const showSupervisor = activeRole === 'supervisor' || activeRole === 'admin'
  const showReports =
    showManagement || showSupervisor || activeRole === 'claims-officer' || activeRole === 'admin'

  const avatarUrl = typeof user.avatar === 'object' && user.avatar ? (user.avatar as any).url : null
  const initial = user.name?.charAt(0)?.toUpperCase() || '?'

  return (
    <RoleProvider initialRole={activeRole} roles={roles}>
      <QuickLogProvider>
        <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
          <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-800 dark:bg-slate-950 text-white p-4 pb-10 space-y-2 border-r border-slate-700">
            <h2 className="text-xl font-bold mb-4">CRM</h2>
            <NavLink href="/crm/dashboard">📊 Dashboard</NavLink>
            <NavLink href="/crm/accounts">📋 Accounts</NavLink>
            {showManagement && (
              <>
                <NavLink href="/crm/users">👥 Users</NavLink>
                <NavLink href="/crm/clients">🏢 Clients</NavLink>
                <NavLink href="/crm/import">➕ Add Accounts</NavLink>
                <NavLink href="/crm/audit-logs">🔍 Audit Logs</NavLink>
              </>
            )}
            {showSupervisor && <NavLink href="/crm/supervisor/users">👥 Manage Team</NavLink>}
            {showReports && <NavLink href="/crm/reports">📊 Reports</NavLink>}
            <div className="flex-1" />
            <NavLink href="/crm/profile">👤 My Profile</NavLink>
            <div className="border-t border-slate-700 pt-4 space-y-3">
              <ThemeToggle />
              <RoleSwitcher roles={roles} activeRole={activeRole} />
              <LogoutButton />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.name || 'User'}</p>
                  <p className="text-xs text-slate-400">{activeRole}</p>
                </div>
              </div>
            </div>
          </aside>
          <MobileSidebar
            showManagement={showManagement}
            showSupervisor={showSupervisor}
            showReports={showReports}
            roles={roles}
            activeRole={activeRole}
            userName={user.name || 'Unknown'}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-0">{children}</main>
        </div>
        <QuickLogPopup />
        <OfflineIndicator />
        <SessionTimeout />
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
