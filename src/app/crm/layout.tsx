import React from 'react'
import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { RoleSwitcher } from '@/components/crm/RoleSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MobileSidebar } from '@/components/crm/MobileSidebar'
import { QuickLogProvider } from '@/components/QuickLogProvider'
import { QuickLogPopup } from '@/components/QuickLogPopup'
import { LogoutButton } from '@/components/crm/LogoutButton'
import { SessionTimeout } from '@/components/crm/SessionTimeout'
import { OfflineIndicator } from '@/components/crm/OfflineIndicator'
import { PWAInstallButton } from '@/components/crm/PWAInstallButton'
import Link from 'next/link'
import {
  getHighestRole,
  canManageUsers,
  canManageClients,
  canImportAccounts,
  canViewReports,
  canViewAuditLogs,
} from '@/lib/permissions'

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

export default async function CrmRootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const cookieStore = await cookies()
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: headersList })

  const pathname = headersList.get('x-pathname') || ''
  if (!user || pathname === '/crm/login') return <>{children}</>

  const roles: string[] = user?.roles ?? []
  const activeRoleCookie = cookieStore.get('x-active-role')?.value

  // Validate the cookie against the user's actual roles.
  // If it's not one of their roles, fall back to their highest role.
  const activeRole: string =
    activeRoleCookie && roles.includes(activeRoleCookie) ? activeRoleCookie : getHighestRole(roles)

  const hasMultipleRoles = roles.length > 1
  const avatarUrl =
    typeof user.avatar === 'object' && user.avatar !== null
      ? (user.avatar as any).url || (user.avatar as any).thumbnailURL
      : undefined
  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase()

  // Nav visibility flags
  const showManagement =
    canManageUsers(activeRole) || canManageClients(activeRole) || canImportAccounts(activeRole)
  const showReports = canViewReports(activeRole)
  const showAuditLogs = canViewAuditLogs(activeRole)

  // Redirect non-CRM roles away
  const hasCrmRole = roles.some((r) =>
    [
      'admin',
      'crm-manager',
      'supervisor',
      'claims-officer',
      'court-agent',
      'process-server',
      'collector',
      'client',
    ].includes(r),
  )
  if (!hasCrmRole) {
    return <div className="p-8 text-center text-gray-500">You do not have access to the CRM.</div>
  }

  return (
    <>
      <QuickLogProvider>
        <div className="flex min-h-screen bg-slate-100 dark:bg-gray-900">
          {/* Desktop sidebar */}
          <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-800 dark:bg-gray-800 p-4 space-y-2 overflow-y-auto">
            <div className="mb-4">
              <Link href="/crm/dashboard" className="text-white text-lg font-bold">
                Isame CRM
              </Link>
            </div>

            <NavLink href="/crm/dashboard">🏠 Dashboard</NavLink>
            <NavLink href="/crm/accounts">📁 Accounts</NavLink>
            {activeRole === 'collector' && (
              <NavLink href="/crm/collector-queue">📋 My Queue</NavLink>
            )}
            {activeRole === 'court-agent' && (
              <NavLink href="/crm/court-queue">⚖️ Court Queue</NavLink>
            )}
            {activeRole === 'process-server' && (
              <NavLink href="/crm/service-queue">📬 Service Queue</NavLink>
            )}
            {activeRole === 'claims-officer' && (
              <NavLink href="/crm/claims-queue">📜 Claims Queue</NavLink>
            )}
            <NavLink href="/crm/calendar">📅 Calendar</NavLink>
            {showManagement && (
              <>
                <NavLink href="/crm/users">👥 Users</NavLink>
                <NavLink href="/crm/clients">🏢 Clients</NavLink>
                <NavLink href="/crm/import">➕ Add Accounts</NavLink>
                {showAuditLogs && <NavLink href="/crm/audit-logs">🔍 Audit Logs</NavLink>}
              </>
            )}
            {activeRole === 'supervisor' && (
              <NavLink href="/crm/supervisor/users">👥 Manage Team</NavLink>
            )}
            {showReports && activeRole !== 'client' && (
              <NavLink href="/crm/reports">📊 Reports</NavLink>
            )}

            <div className="flex-1" />
            <PWAInstallButton />
            <NavLink href="/crm/profile">👤 My Profile</NavLink>
            <div className="border-t border-slate-700 pt-4 space-y-3">
              <ThemeToggle />
              {hasMultipleRoles && <RoleSwitcher roles={roles} activeRole={activeRole} />}
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
                  <p className="text-sm font-medium text-white">{user.name || 'User'}</p>
                  <p className="text-xs text-slate-400">{ROLE_LABELS[activeRole] ?? activeRole}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile sidebar */}
          <MobileSidebar
            showManagement={showManagement}
            showSupervisor={activeRole === 'supervisor'}
            showReports={showReports}
            roles={roles}
            activeRole={activeRole}
            userName={user.name || 'Unknown'}
          />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-0">{children}</main>
        </div>
        <QuickLogPopup />
        <SessionTimeout />
      </QuickLogProvider>
    </>
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
