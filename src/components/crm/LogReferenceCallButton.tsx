'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function LogReferenceCallButton({
  accountId,
  referenceName,
}: {
  accountId: string
  referenceName: string
}) {
  const [open, setOpen] = useState(false)
  const [outcome, setOutcome] = useState('no_answer')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/call-attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: accountId,
        contactType: 'reference',
        referenceName,
        outcome,
        notes,
        callDate: new Date().toISOString(),
      }),
    })
    if (res.ok) {
      setOpen(false)
      setNotes('')
      setOutcome('no_answer')
      showToast('Call logged')
      // Optionally, you could trigger a refresh of the calls list.
      // For now, the popover closes and the next time the user opens the Calls tab, it'll be up to date.
    } else {
      showToast('Failed to log call', 'error')
    }
    setSubmitting(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
      >
        Log Call
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
          <form onSubmit={handleSubmit} className="space-y-3">
            <h5 className="font-medium text-sm">Log call to {referenceName}</h5>
            <div>
              <label className="block text-xs text-gray-500">Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-900 dark:border-gray-600"
              >
                <option value="no_answer">No Answer</option>
                <option value="voicemail">Voicemail</option>
                <option value="right_party_contact">Right Party Contact</option>
                <option value="wrong_number">Wrong Number</option>
                <option value="disconnected">Disconnected</option>
                <option value="callback_requested">Callback Requested</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-900 dark:border-gray-600"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-gray-500 hover:underline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
