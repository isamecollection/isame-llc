'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function CreateCollectorForm({ supervisorId }: { supervisorId: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        roles: ['collector'],
        supervisor: supervisorId,
      }),
    })
    if (res.ok) {
      showToast('Collector created')
      window.location.reload()
    } else {
      showToast('Failed to create collector', 'error')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Collector</h3>
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create Collector'}
      </button>
    </form>
  )
}
