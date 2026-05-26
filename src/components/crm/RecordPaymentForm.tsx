'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function RecordPaymentForm({
  accountId,
  currentBalance,
  onSuccess,
}: {
  accountId: string
  currentBalance: number
  onSuccess?: () => void
}) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('credit_card')
  const [submitting, setSubmitting] = useState(false)

  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      showToast('Enter a valid amount', 'error')
      return
    }
    setSubmitting(true)

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: accountId,
        amount: parseFloat(amount),
        method,
        status: 'completed',
        date: new Date().toISOString().split('T')[0],
      }),
    })

    if (res.ok) {
      showToast('Payment recorded!')
      setAmount('')
      onSuccess?.()
    } else {
      showToast('Failed to record payment.', 'error')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Record Payment</h3>

      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
        <span className="text-sm text-gray-600 dark:text-gray-400">Outstanding</span>
        <span className="text-lg font-bold">${currentBalance.toLocaleString()}</span>
      </div>

      <button
        type="button"
        onClick={() => setAmount(currentBalance.toString())}
        className="w-full py-2 px-4 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
      >
        Pay Full Balance
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        >
          <option value="credit_card">Credit Card</option>
          <option value="ach">ACH</option>
          <option value="check">Check</option>
          <option value="cash">Cash</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit Payment'}
      </button>
    </form>
  )
}
