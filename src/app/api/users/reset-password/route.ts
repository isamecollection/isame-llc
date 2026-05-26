import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const payload = await getPayload()

  // 1. Authenticate supervisor
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !user.roles?.includes('supervisor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, newPassword } = await request.json()
  if (!userId || !newPassword) {
    return NextResponse.json({ error: 'Missing userId or newPassword' }, { status: 400 })
  }

  // 2. Fetch target user
  let targetUser
  try {
    targetUser = await payload.findByID({ collection: 'users', id: userId })
  } catch (error) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 3. Verify supervisor relationship (handle both string ID and populated object)
  const supervisorId =
    typeof targetUser.supervisor === 'string' ? targetUser.supervisor : targetUser.supervisor?.id

  if (supervisorId !== user.id) {
    return NextResponse.json({ error: 'User not in your team' }, { status: 403 })
  }

  // 4. Reset password (Payload hashes it automatically)
  await payload.update({
    collection: 'users',
    id: userId,
    data: { password: newPassword },
  })

  return NextResponse.json({ success: true })
}
