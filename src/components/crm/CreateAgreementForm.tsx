'use client'
import { useState } from 'react'

type Frequency = 'weekly' | 'biweekly' | 'monthly'

export function CreateAgreementForm({
  accountId,
  currentBalance,
  onSuccess,
}: {
  accountId: string
  currentBalance: number
  onSuccess?: () => void
}) {
  const [type, setType] = useState('promise_to_pay')
  const [totalAmount, setTotalAmount] = useState(currentBalance.toString())
  const [installments, setInstallments] = useState('1')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!totalAmount || parseFloat(totalAmount) <= 0) return alert('Enter a valid amount')
    setSubmitting(true)

    // 1. Create the agreement
    const agreementRes = await fetch('/api/agreements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: accountId,
        type,
        totalAmount: parseFloat(totalAmount),
        status: 'active',
      }),
    })

    if (!agreementRes.ok) {
      alert('Failed to create agreement')
      setSubmitting(false)
      return
    }

    const agreement = await agreementRes.json()
    const agreementId = agreement.doc.id

    // 2. If payment plan, generate scheduled payments
    if (type === 'payment_plan') {
      const num = parseInt(installments)
      const amountPerInstallment = (parseFloat(totalAmount) / num).toFixed(2)
      const startDate = new Date()

      for (let i = 0; i < num; i++) {
        const dueDate = new Date(startDate)
        if (frequency === 'weekly') dueDate.setDate(dueDate.getDate() + 7 * i)
        else if (frequency === 'biweekly') dueDate.setDate(dueDate.getDate() + 14 * i)
        else if (frequency === 'monthly') dueDate.setMonth(dueDate.getMonth() + i)

        await fetch('/api/scheduled-payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account: accountId,
            amount: parseFloat(amountPerInstallment),
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'pending',
            agreement: agreementId,
          }),
        })
      }
    }

    alert('Agreement created!')
    onSuccess?.()
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">New Agreement</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        >
          <option value="promise_to_pay">Promise to Pay</option>
          <option value="settlement">Settlement</option>
          <option value="payment_plan">Payment Plan</option>
        </select>

        <input
          type="number"
          placeholder="Total Amount"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {type === 'payment_plan' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Number of installments"
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
            min="1"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi‑Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {submitting ? 'Creating…' : 'Create Agreement'}
      </button>
    </form>
  )
}
