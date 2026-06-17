import { cookies } from 'next/headers'
import { getHighestRole } from '@/lib/permissions'

export async function getActiveRole(user: any): Promise<string> {
  const roles: string[] = user?.roles ?? []
  const cookieStore = await cookies()
  const activeRoleCookie = cookieStore.get('activeRole')?.value

  // If cookie points to a valid role, use it; otherwise fall back to highest priority
  return activeRoleCookie && roles.includes(activeRoleCookie)
    ? activeRoleCookie
    : getHighestRole(roles)
}
