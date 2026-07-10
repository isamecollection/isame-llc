import { cookies } from 'next/headers'
import { getHighestRole } from '@/lib/permissions'

export async function getActiveRole(user: any): Promise<string> {
  const roles: string[] = user?.roles ?? []
  const cookieStore = await cookies()
  const cookie = cookieStore.get('x-active-role')?.value

  console.log('━━━━━━━━━━━━━━━━━━━━━━')
  console.log('User roles:', roles)
  console.log('x-active-role cookie:', cookie)
  console.log('Highest role fallback:', getHighestRole(roles))
  console.log('━━━━━━━━━━━━━━━━━━━━━━')

  return cookie && roles.includes(cookie)
    ? cookie
    : getHighestRole(roles)
}