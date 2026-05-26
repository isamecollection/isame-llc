'use client'
import { useState } from 'react'

export function AddNoteForm({ accountId }: { accountId: string }) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: accountId, content }),
    })
    if (res.ok) {
      setContent('')
      alert('Note added')
      window.location.reload()
    } else {
      alert('Failed to add note')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      <h3>Add Note</h3>
      <textarea
        rows={3}
        placeholder="Enter note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <br />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save Note'}
      </button>
    </form>
  )
}
