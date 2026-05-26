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
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-lg font-semibold">Add Note</h3>
      <textarea
        rows={5}
        placeholder="Enter your note here…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-y"
      />
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Saving…' : 'Save Note'}
      </button>
    </form>
  )
}
