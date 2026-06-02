import { getPayload } from '@/payload'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  const { userId, currentPassword, newPassword, sendEmail } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const payload = await getPayload()

  try {
    const user = await payload.findByID({ collection: 'users', id: userId })

    // Email reset flow
    if (sendEmail) {
      const resetToken = uuidv4()
      const resetExpiry = new Date(Date.now() + 3600000).toISOString()

      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpiration: resetExpiry,
        },
      })

      const resetUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/crm/reset-password?token=${resetToken}`

      await payload.sendEmail({
        to: user.email,
        subject: 'Reset your Isame CRM password',
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;border-radius:8px;text-decoration:none;">Reset Password</a>
          <p style="margin-top:16px;color:#666;">If you didn't request this, ignore this email.</p>
        `,
      })

      return NextResponse.json({ success: true })
    }

    // Direct password change (requires current password)
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Verify current password
    const loginAttempt = await payload
      .login({
        collection: 'users',
        data: { email: user.email, password: currentPassword },
      })
      .catch(() => null)

    if (!loginAttempt) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    await payload.update({
      collection: 'users',
      id: userId,
      data: { password: newPassword },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
