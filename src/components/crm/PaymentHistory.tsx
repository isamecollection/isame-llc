'use client'

import { useState } from 'react'
import { isManagementRole } from '@/lib/permissions'

export function PaymentHistory({
  payments,
  accountBalance,
  userRoles = [],
}: {
  payments: any[]
  accountBalance?: number
  userRoles?: string[]
}) {
  const [voidingId, setVoidingId] = useState<string | null>(null)
  const [voidModal, setVoidModal] = useState<{
    paymentId: string
    amount: number
  } | null>(null)
  const [voidReason, setVoidReason] = useState('')

  // Check if current user can void payments
  const canVoid = userRoles.some((role: string) => isManagementRole(role))

  if (payments.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No payments recorded yet.</p>
  }

  const handleVoidClick = (paymentId: string, amount: number) => {
    setVoidModal({ paymentId, amount })
    setVoidReason('')
  }

  const handleVoidConfirm = async () => {
    if (!voidModal || !voidReason.trim()) return

    setVoidingId(voidModal.paymentId)
    setVoidModal(null)

    try {
      const response = await fetch(`/api/payments/${voidModal.paymentId}/void`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason }),
      })

      const result = await response.json()

      if (result.success) {
        alert('Payment voided successfully')
        window.location.reload()
      } else {
        alert(result.error || 'Failed to void payment')
      }
    } catch (error) {
      alert('Error voiding payment')
      console.error(error)
    } finally {
      setVoidingId(null)
      setVoidReason('')
    }
  }

  // Calculate running balance for each payment (newest first)
  let runningBalance = accountBalance || 0
  const paymentsWithBalance = [...payments]
    .sort(
      (a, b) =>
        new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime(),
    )
    .map((p) => {
      const balanceBefore = runningBalance + (p.amount || 0)
      runningBalance = Math.max(0, runningBalance - (p.amount || 0))
      return { ...p, balanceBefore, balanceAfter: runningBalance }
    })
    .reverse()

  return (
    <>
      <div className="space-y-2">
        {paymentsWithBalance.map((p: any) => (
          <div
            key={p.id}
            className={`bg-white dark:bg-gray-800 border rounded-lg p-3 ${
              p.status === 'refunded'
                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`font-semibold text-lg ${
                    p.status === 'refunded' ? 'text-red-600 line-through' : 'text-green-600'
                  }`}
                >
                  ${p.amount?.toLocaleString()}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                  {p.method?.replace('_', ' ')}
                </span>
                {p.status === 'refunded' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">
                    REFUNDED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/payments/receipt/${p.id}`}
                  target="_blank"
                  className="px-3 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  📄 Receipt
                </a>

                {canVoid && p.status !== 'refunded' && (
                  <button
                    onClick={() => handleVoidClick(p.id, p.amount)}
                    disabled={voidingId === p.id}
                    className="px-3 py-1 text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                  >
                    {voidingId === p.id ? '⏳' : '↩️'} Void
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>📅 {p.date ? new Date(p.date).toLocaleDateString() : '—'}</span>
              {p.reference && <span>🔢 {p.reference}</span>}
              <span>
                Before: <strong>${p.balanceBefore?.toLocaleString()}</strong>
              </span>
              <span>
                → After: <strong>${p.balanceAfter?.toLocaleString()}</strong>
              </span>
            </div>
            {p.notes && (
              <p
                className={`text-xs mt-1 italic ${
                  p.notes?.includes('REFUNDED') ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                }`}
              >
                {p.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Void Confirmation Modal */}
      {voidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Void Payment</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to void this payment of{' '}
              <strong>${voidModal.amount.toFixed(2)}</strong>? This will reverse the account balance
              and cannot be undone.
            </p>
            <label className="block text-sm font-medium mb-1">Reason for voiding:</label>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm mb-4"
              rows={3}
              placeholder="Enter reason..."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setVoidModal(null)}
                className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVoidConfirm}
                disabled={!voidReason.trim()}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
