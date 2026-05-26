'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MergeForm({ sourceId, candidates }: { sourceId: string; candidates: any[] }) {
  const [targetId, setTargetId] = useState('')
  const [combineBalances, setCombineBalances] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!targetId) return alert('Select a target account')
    if (targetId === sourceId) return alert('Cannot merge into itself')
    setSubmitting(true)

    const res = await fetch('/api/merge-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId, targetId, combineBalances }),
    })

    if (res.ok) {
      alert('Accounts merged successfully')
      router.push(`/crm/accounts/${targetId}`)
    } else {
      const data = await res.json()
      alert('Merge failed: ' + (data.error || 'Unknown error'))
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Select Target Account
        </label>
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          <option value="">-- choose target --</option>
          {candidates.map((acc: any) => (
            <option key={acc.id} value={acc.id}>
              {acc.debtorName} ({acc.accountNumber}) – ${acc.currentBalance}
              {acc.ssn ? ` SSN: ${acc.ssn}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="combineBalances"
          checked={combineBalances}
          onChange={(e) => setCombineBalances(e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-600"
        />
        <label htmlFor="combineBalances" className="text-sm text-gray-700 dark:text-gray-300">
          Combine balances (add source balance to target)
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {submitting ? 'Merging…' : 'Merge Accounts'}
      </button>
    </form>
  )
}
