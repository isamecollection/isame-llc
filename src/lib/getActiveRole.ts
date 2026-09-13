import { cookies } from 'next/headers'
import { getHighestRole } from '@/lib/permissions'

export async function getActiveRole(user: any): Promise<string> {
  const roles: string[] = user?.roles ?? []
  const cookieStore = await cookies()
  const cookie = cookieStore.get('x-active-role')?.value

  // Validate the cookie against the user's actual roles.
  // If it's not a role they have, fall back to their highest role.
  if (cookie && roles.includes(cookie)) {
    return cookie
  }

  return getHighestRole(roles)
}
