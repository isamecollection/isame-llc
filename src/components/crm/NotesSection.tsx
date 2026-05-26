'use client'
import { useState, useEffect } from 'react'

export function NotesSection({ accountId }: { accountId: string }) {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load notes on mount
  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch(
          `/api/notes?where[account][equals]=${accountId}&sort=-createdAt&limit=50`,
        )
        const data = await res.json()
        setNotes(data.docs || [])
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    fetchNotes()
  }, [accountId])

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: accountId, content }),
    })
    if (res.ok) {
      const newNote = await res.json()
      setNotes([newNote.doc, ...notes]) // prepend new note
      setContent('')
    } else {
      alert('Failed to add note')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      {/* Add note form – always visible at the top */}
      <form onSubmit={handleAddNote} className="space-y-3">
        <textarea
          rows={4}
          placeholder="Enter your note here…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving…' : 'Save Note'}
        </button>
      </form>

      {/* Scrollable note history */}
      <div>
        <h4 className="font-semibold mb-2">History</h4>
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : notes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No notes yet.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notes.map((n: any) => (
                <div key={n.id} className="py-2">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {n.content}
                  </p>
                  <small className="text-gray-500">{new Date(n.createdAt).toLocaleString()}</small>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
