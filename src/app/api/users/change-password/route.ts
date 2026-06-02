import { getPayload } from '@/payload'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { userId, currentPassword, newPassword } = await request.json()

  if (!userId || !currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const payload = await getPayload()

  try {
    // Verify current password by attempting login
    const user = await payload.findByID({ collection: 'users', id: userId })

    const loginAttempt = await payload
      .login({
        collection: 'users',
        data: {
          email: user.email,
          password: currentPassword,
        },
      })
      .catch(() => null)

    if (!loginAttempt) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    // Update password
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        password: newPassword,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
