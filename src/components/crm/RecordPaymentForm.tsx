'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function RecordPaymentForm({
  accountId,
  currentBalance,
  debtorName,
  onSuccess,
}: {
  accountId: string
  currentBalance: number
  debtorName?: string
  onSuccess?: () => void
}) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Bank transfer fields
  const [bankFrom, setBankFrom] = useState('')
  const [accountFrom, setAccountFrom] = useState('')
  const [accountFromName, setAccountFromName] = useState('')
  const [bankTo, setBankTo] = useState('')
  const [accountTo, setAccountTo] = useState('')
  const [transferTime, setTransferTime] = useState('')
  const [receiptImage, setReceiptImage] = useState<File | null>(null)

  const { showToast } = useToast()
  const isBankTransfer = method === 'bank_transfer' || method === 'online'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const paymentAmount = parseFloat(amount)
    if (!paymentAmount || paymentAmount <= 0) {
      showToast('Enter a valid amount', 'error')
      return
    }
    setSubmitting(true)

    const body: any = {
      account: accountId,
      amount: paymentAmount,
      method,
      reference: reference || undefined,
      notes: notes || undefined,
      date,
      status: 'completed',
    }

    // Add bank transfer details if applicable
    if (isBankTransfer) {
      body.bankFrom = bankFrom || undefined
      body.accountFrom = accountFrom || undefined
      body.accountFromName = accountFromName || undefined
      body.bankTo = bankTo || undefined
      body.accountTo = accountTo || undefined
      body.transferTime = transferTime || undefined
    }

    // Upload receipt image if provided
    if (receiptImage) {
      const formData = new FormData()
      formData.append('file', receiptImage)
      const uploadRes = await fetch('/api/media', { method: 'POST', body: formData })
      if (uploadRes.ok) {
        const mediaDoc = await uploadRes.json()
        body.receiptImage = mediaDoc.doc.id
      }
    }

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const data = await res.json()
      showToast('Payment recorded!')
      setReceiptUrl(data.receiptUrl)
      setPaymentSuccess(true)
      setAmount('')
      setReference('')
      setNotes('')
      setBankFrom('')
      setAccountFrom('')
      setAccountFromName('')
      setBankTo('')
      setAccountTo('')
      setTransferTime('')
      setReceiptImage(null)
      onSuccess?.()
    } else {
      const data = await res.json().catch(() => ({}))
      showToast(data.error || 'Failed to record payment', 'error')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {debtorName ? `${debtorName} · ` : ''}Outstanding
        </span>
        <span className="text-lg font-bold">${currentBalance?.toLocaleString()}</span>
      </div>

      <button
        type="button"
        onClick={() => setAmount(currentBalance?.toString() || '')}
        className="w-full py-2 px-4 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors text-sm font-medium"
      >
        💡 Pay Full Balance
      </button>

      {!paymentSuccess ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online Payment</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Reference #
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Check #, Trans ID"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          </div>

          {/* Bank Transfer Details */}
          {isBankTransfer && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                🏦 Bank Transfer Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Bank From
                  </label>
                  <input
                    type="text"
                    value={bankFrom}
                    onChange={(e) => setBankFrom(e.target.value)}
                    placeholder="e.g. Heritage Bank"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Account # From
                  </label>
                  <input
                    type="text"
                    value={accountFrom}
                    onChange={(e) => setAccountFrom(e.target.value)}
                    placeholder="Sending account number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Account Name From
                  </label>
                  <input
                    type="text"
                    value={accountFromName}
                    onChange={(e) => setAccountFromName(e.target.value)}
                    placeholder="Name on sending account"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Transfer Time
                  </label>
                  <input
                    type="time"
                    value={transferTime}
                    onChange={(e) => setTransferTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Bank To (Receiving)
                  </label>
                  <input
                    type="text"
                    value={bankTo}
                    onChange={(e) => setBankTo(e.target.value)}
                    placeholder="e.g. Atlantic Bank"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Account # To
                  </label>
                  <input
                    type="text"
                    value={accountTo}
                    onChange={(e) => setAccountTo(e.target.value)}
                    placeholder="Receiving account number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Receipt Screenshot
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setReceiptImage(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Payment notes..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {submitting ? 'Recording...' : '✅ Record Payment'}
          </button>
        </form>
      ) : (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            ✅ Payment recorded successfully!
          </p>
          <div className="flex gap-2">
            <a
              href={receiptUrl!}
              target="_blank"
              className="flex-1 py-2 px-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              📄 View Receipt
            </a>
            <a
              href={receiptUrl!}
              download
              className="flex-1 py-2 px-4 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              💾 Save as PDF
            </a>
          </div>
          <button
            onClick={() => setPaymentSuccess(false)}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Record another payment
          </button>
        </div>
      )}
    </div>
  )
}
