'use client'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'

export function LegalCaseForm({ accountId }: { accountId: string }) {
  const [caseExists, setCaseExists] = useState(false)
  const [caseId, setCaseId] = useState<string | null>(null)
  const [status, setStatus] = useState('new')
  const [caseNumber, setCaseNumber] = useState('')
  const [court, setCourt] = useState('')
  const [filedDate, setFiledDate] = useState('')
  const [reason, setReason] = useState('')
  const [attorney, setAttorney] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const { showToast } = useToast()

  useEffect(() => {
    async function loadCase() {
      try {
        const res = await fetch(`/api/legal-cases?where[account][equals]=${accountId}&limit=1`)
        const json = await res.json()
        if (json.docs && json.docs.length > 0) {
          const c = json.docs[0]
          setCaseExists(true)
          setCaseId(c.id)
          setStatus(c.status || 'new')
          setCaseNumber(c.caseNumber || '')
          setCourt(c.court || '')
          setFiledDate(c.filedDate ? c.filedDate.slice(0, 10) : '')
          setReason(c.reason || '')
          setAttorney(c.attorney || '')
          setNotes(c.notes || '')
        }
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    loadCase()
  }, [accountId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const body = {
      status,
      caseNumber,
      court,
      filedDate: filedDate || undefined,
      reason,
      attorney: attorney || undefined,
      notes: notes || undefined,
    }

    const url = caseId ? `/api/legal-cases/${caseId}` : '/api/legal-cases'
    const method = caseId ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseId ? body : { account: accountId, ...body }),
    })

    if (res.ok) {
      showToast(caseId ? 'Case updated!' : 'Case created!')
      window.location.reload()
    } else {
      showToast('Failed to save case.', 'error')
    }
    setSubmitting(false)
  }

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading legal case…</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">
        {caseExists ? 'Edit Legal Case' : 'Initiate Legal Case'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="new">New</option>
            <option value="under_review">Under Review</option>
            <option value="filed">Filed</option>
            <option value="served">Served</option>
            <option value="discovery">Discovery</option>
            <option value="trial">Trial</option>
            <option value="settled">Settled</option>
            <option value="judgment">Judgment</option>
            <option value="dismissed">Dismissed</option>
            <option value="appealed">Appealed</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Attorney */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Attorney (user ID)
          </label>
          <input
            type="text"
            value={attorney}
            onChange={(e) => setAttorney(e.target.value)}
            placeholder="User ID"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Case Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Case Number
          </label>
          <input
            type="text"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Court */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Court
          </label>
          <input
            type="text"
            value={court}
            onChange={(e) => setCourt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filed Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filed Date
          </label>
          <input
            type="date"
            value={filedDate}
            onChange={(e) => setFiledDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Reason for Escalation
        </label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* Internal Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Internal Notes
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {submitting ? 'Saving…' : caseExists ? 'Update Case' : 'Create Case'}
      </button>
    </form>
  )
}
