'use client'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'

export function CallsSection({ accountId }: { accountId: string }) {
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [contactType, setContactType] = useState('debtor')
  const [referenceName, setReferenceName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callDate, setCallDate] = useState(new Date().toISOString().slice(0, 16))
  const [duration, setDuration] = useState('')
  const [outcome, setOutcome] = useState('no_answer')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { showToast } = useToast()

  async function fetchCalls() {
    setLoading(true)
    const res = await fetch(
      `/api/call-attempts?where[account][equals]=${accountId}&sort=-callDate&limit=20`,
    )
    const data = await res.json()
    setCalls(data.docs || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchCalls()
  }, [accountId])

  async function handleLogCall(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/call-attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: accountId,
        contactType,
        referenceName: contactType === 'reference' ? referenceName : undefined,
        phoneNumber,
        callDate: new Date(callDate).toISOString(),
        duration: duration ? parseInt(duration) : undefined,
        outcome,
        notes,
      }),
    })
    if (res.ok) {
      setShowForm(false)
      setContactType('debtor')
      setReferenceName('')
      setPhoneNumber('')
      setDuration('')
      setOutcome('no_answer')
      setNotes('')
      showToast('Call logged')
      fetchCalls()
    } else {
      showToast('Failed to log call', 'error')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Call History</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showForm ? 'Cancel' : '+ Log Call'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleLogCall}
          className="space-y-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500">Contact Type</label>
              <select
                value={contactType}
                onChange={(e) => setContactType(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="debtor">Debtor</option>
                <option value="reference">Reference</option>
              </select>
            </div>
            {contactType === 'reference' && (
              <div>
                <label className="block text-xs text-gray-500">Reference Name</label>
                <input
                  type="text"
                  value={referenceName}
                  onChange={(e) => setReferenceName(e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500">Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Date/Time</label>
              <input
                type="datetime-local"
                value={callDate}
                onChange={(e) => setCallDate(e.target.value)}
                required
                className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Duration (sec)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
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
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500">Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save Call'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : calls.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No calls logged.</p>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {calls.map((c: any) => (
            <div key={c.id} className="py-2">
              <p className="text-gray-800 dark:text-gray-200">
                <strong>
                  {c.contactType === 'reference' ? `Ref: ${c.referenceName}` : 'Debtor'}
                </strong>{' '}
                – {c.outcome}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(c.callDate).toLocaleString()} | {c.duration || 0}s
              </p>
              {c.notes && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">{c.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
