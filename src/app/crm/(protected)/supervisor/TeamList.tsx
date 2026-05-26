'use client'
import { useState } from 'react'

export function TeamList({ members }: { members: any[] }) {
  const [resetting, setResetting] = useState<string | null>(null)

  async function resetPassword(userId: string) {
    const newPass = prompt('Enter new password:')
    if (!newPass) return
    setResetting(userId)
    const res = await fetch('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword: newPass }),
    })
    if (res.ok) alert('Password reset')
    else alert('Failed to reset password')
    setResetting(null)
  }

  return (
    <div>
      <h2>Team Members</h2>
      <ul>
        {members.map((m: any) => (
          <li key={m.id}>
            {m.name} ({m.email})
            <button onClick={() => resetPassword(m.id)} disabled={resetting === m.id}>
              {resetting === m.id ? 'Resetting…' : 'Reset Password'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
