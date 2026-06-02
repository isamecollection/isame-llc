export function PaymentHistory({
  payments,
  accountBalance,
}: {
  payments: any[]
  accountBalance?: number
}) {
  if (payments.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No payments recorded yet.</p>
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
    <div className="space-y-2">
      {paymentsWithBalance.map((p: any) => (
        <div
          key={p.id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-green-600 font-semibold text-lg">
                ${p.amount?.toLocaleString()}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                {p.method?.replace('_', ' ')}
              </span>
            </div>
            <a
              href={`/api/payments/receipt/${p.id}`}
              download
              className="px-3 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              📄 Receipt
            </a>
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
          {p.notes && <p className="text-xs text-gray-400 mt-1 italic">{p.notes}</p>}
        </div>
      ))}
    </div>
  )
}
