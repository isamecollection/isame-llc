import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const payload = await getPayload()

  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roles: string[] = user.roles || []
  const isAdmin = roles.includes('admin')
  const isCrmManager = roles.includes('crm-manager')
  const isSupervisor = roles.includes('supervisor')

  if (!isAdmin && !isCrmManager && !isSupervisor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, newPassword } = await request.json()
  if (!userId || !newPassword) {
    return NextResponse.json({ error: 'Missing userId or newPassword' }, { status: 400 })
  }

  let targetUser
  try {
    targetUser = await payload.findByID({ collection: 'users', id: userId })
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Admins + CRM managers: reset anyone's password
  // Supervisors: only their team (users whose `supervisor` points to them)
  if (!isAdmin && !isCrmManager) {
    const supervisorId =
      typeof targetUser.supervisor === 'string'
        ? targetUser.supervisor
        : targetUser.supervisor?.id

    if (supervisorId !== user.id) {
      return NextResponse.json({ error: 'User not in your team' }, { status: 403 })
    }
  }

  await payload.update({
    collection: 'users',
    id: userId,
    data: { password: newPassword },
  })

  return NextResponse.json({ success: true })
}