// src/app/crm/(protected)/layout.tsx
import { getPayload } from '@/payload'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const cookieStore = await cookies()

  // Build a Headers object that includes the Cookie header
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

  // Allow users with any of these internal roles
  const allowedRoles = ['collector', 'crm-manager', 'supervisor', 'admin']
  if (!user || !user.roles?.some((r) => allowedRoles.includes(r))) {
    redirect('/crm/login')
  }

  return <>{children}</>
}
