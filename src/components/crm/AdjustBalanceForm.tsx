'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function AdjustBalanceForm({
  accountId,
  currentBalance,
}: {
  accountId: string
  currentBalance: number
}) {
  const [open, setOpen] = useState(false)
  const [newBalance, setNewBalance] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const parsed = parseFloat(newBalance) || 0
  const delta = Math.round((parsed - currentBalance) * 100) / 100

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      showToast('Reason is required', 'error')
      return
    }
    if (Math.abs(delta) < 0.01) {
      showToast('New balance is the same as current', 'error')
      return
    }
    setSubmitting(true)

    const res = await fetch('/api/balance-adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: accountId,
        newBalance: parsed,
        reason: reason.trim(),
        previousBalance: currentBalance,
        delta: 0,
        adjustedBy: 'placeholder',
      }),
    })

    if (res.ok) {
      showToast('Balance adjusted')
      setOpen(false)
      setNewBalance('')
      setReason('')
      window.location.reload()
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err?.errors?.[0]?.message || 'Failed to adjust balance', 'error')
    }
    setSubmitting(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
      >
        Adjust Balance
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20 space-y-3"
    >
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-amber-900 dark:text-amber-200">Adjust Balance</h4>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      <div className="text-sm text-gray-700 dark:text-gray-300">
        Current: <strong>${currentBalance.toLocaleString()}</strong>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">New Balance $</label>
        <input
          type="number"
          step="0.01"
          value={newBalance}
          onChange={(e) => setNewBalance(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
        {newBalance && (
          <p className={`text-xs mt-1 ${delta > 0 ? 'text-red-600' : 'text-green-600'}`}>
            Change: {delta > 0 ? '+' : ''}${delta.toLocaleString()}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Reason *</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Settlement agreement #1234 — wrote off 15%"
          className="w-full px-3 py-2 border rounded-lg text-sm"
          required
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
      >
        {submitting ? 'Applying…' : 'Apply Adjustment'}
      </button>
    </form>
  )
}
