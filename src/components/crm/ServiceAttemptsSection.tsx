'use client'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'

export function ServiceAttemptsSection({
  accountId,
  readOnly = false,
}: {
  accountId: string
  readOnly?: boolean
}) {
  const [attempts, setAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [outcome, setOutcome] = useState('served')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const fetchAttempts = async () => {
    setLoading(true)
    const res = await fetch(
      `/api/service-attempts?where[account][equals]=${accountId}&sort=-attemptDate`,
    )
    const data = await res.json()
    setAttempts(data.docs || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchAttempts()
  }, [accountId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    let mediaId = null
    if (file) {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/media', { method: 'POST', body: formData })
      if (uploadRes.ok) {
        const mediaDoc = await uploadRes.json()
        mediaId = mediaDoc.doc.id
      } else {
        showToast('Failed to upload photo', 'error')
        setSubmitting(false)
        return
      }
    }

    const res = await fetch('/api/service-attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: accountId,
        outcome,
        notes,
        photo: mediaId,
        attemptDate: new Date().toISOString(),
      }),
    })

    if (res.ok) {
      showToast('Service attempt logged')
      setNotes('')
      setFile(null)
      fetchAttempts()
    } else {
      showToast('Failed to log attempt', 'error')
    }
    setSubmitting(false)
  }

  // Get service status from account
  const serviceStatus = attempts.length > 0 ? attempts[0]?.outcome : null
  const isServed = serviceStatus === 'served'

  return (
    <div className="space-y-6">
      {/* Service Status Banner */}
      {isServed && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-green-700 dark:text-green-300">Summons Served</p>
            <p className="text-sm text-green-600 dark:text-green-400">
              This account has been served. View details below.
            </p>
          </div>
        </div>
      )}

      {!isServed && !readOnly && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            📋 This account has not been served yet.
          </p>
        </div>
      )}

      {/* Log attempt form - only if not read-only */}
      {!readOnly && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4"
        >
          <h4 className="font-semibold">Log Service Attempt</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Outcome
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              <option value="served">Served</option>
              <option value="not_served">Not Served</option>
              <option value="refused">Refused</option>
              <option value="moved">Moved</option>
              <option value="deceased">Deceased</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Photo (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {submitting ? 'Logging…' : 'Log Service Attempt'}
          </button>
        </form>
      )}

      {/* Service History - visible to all */}
      <div>
        <h4 className="font-semibold mb-3">Service History</h4>
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : attempts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No attempts recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {attempts.map((a: any) => (
              <div
                key={a.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          a.outcome === 'served'
                            ? 'bg-green-100 text-green-700'
                            : a.outcome === 'refused'
                              ? 'bg-red-100 text-red-700'
                              : a.outcome === 'moved'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {a.outcome?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(a.attemptDate).toLocaleDateString()}
                      </span>
                    </div>
                    {a.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{a.notes}</p>
                    )}
                    {a.photo && (
                      <a
                        href={a.photo?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-1 inline-block"
                      >
                        📷 View Photo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
