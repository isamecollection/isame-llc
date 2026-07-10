// src/app/crm/(protected)/layout.tsx
import { getPayload } from '@/payload'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { getActiveRole } from '@/lib/getActiveRole'
import { RoleProvider } from '@/context/RoleContext'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const cookieStore = await cookies()

  const requestHeaders = new Headers(headersList)
  const cookieString = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')
  if (cookieString) {
    requestHeaders.set('Cookie', cookieString)
  }

  const payload = await getPayload()
  const { user } = await payload.auth({ headers: requestHeaders })

  const allowedRoles = [
    'collector',
    'crm-manager',
    'supervisor',
    'admin',
    'court-agent',
    'process-server',
    'claims-officer',
    'client',
  ]

  if (!user || !user.roles?.some((r) => allowedRoles.includes(r))) {
    redirect('/crm/login')
  }

  const activeRole = await getActiveRole(user)
  const roles = user.roles ?? []

  return (
    <>
      {/* 🔑 Set the role cookie BEFORE any JavaScript loads – no more 403s */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.cookie = 'x-active-role=${activeRole}; path=/; SameSite=Lax'`,
        }}
      />
      <RoleProvider initialRole={activeRole} roles={roles}>
        {children}
      </RoleProvider>
    </>
  )
}