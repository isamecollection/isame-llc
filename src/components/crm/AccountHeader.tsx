import Link from 'next/link'
import { maskSSN } from '@/lib/maskPii'

export function AccountHeader({
  account,
  showMerge,
  userRole,
}: {
  account: any
  showMerge?: boolean
  userRole?: string
}) {
  const isProcessServer = userRole === 'process-server'

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{account.debtorName || 'Account'}</h1>
          <p className="text-sm text-gray-500">{account.accountNumber}</p>
          {isProcessServer && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full mt-1 inline-block">
              Process Server View
            </span>
          )}
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            account.status === 'active'
              ? 'bg-green-100 text-green-700'
              : account.status === 'legal'
                ? 'bg-red-100 text-red-700'
                : account.status === 'paid'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
          }`}
        >
          {account.status}
        </span>
      </div>

      {/* Financial Info - Hidden for Process Server */}
      {!isProcessServer && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div>
            <p className="text-xs text-gray-500">Balance</p>
            <p className="text-xl font-bold">${account.currentBalance?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Collectable</p>
            <p className="text-xl font-bold">${account.totalCollectable?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Paid</p>
            <p className="text-xl font-bold text-green-600">
              ${account.paymentsReceived?.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">SSN</p>
            <p className="text-xl font-bold">
              {account.ssn ? (
                <Link
                  href={`/crm/debtors/${account.ssn}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  title={account.ssn}
                >
                  {maskSSN(account.ssn)}
                </Link>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Contact Info - Only for non-Process Server */}
      {!isProcessServer && (
        <div className="flex gap-2 mt-3 text-sm text-gray-500">
          {account.street && (
            <span>
              📍 {[account.street, account.townCity, account.district].filter(Boolean).join(', ')}
            </span>
          )}
          {account.phone && <span>📞 {account.phone}</span>}
        </div>
      )}

      {showMerge && !isProcessServer && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href={`/crm/accounts/${account.id}/merge`}
            className="text-red-600 dark:text-red-400 hover:underline text-sm"
          >
            Merge Account
          </Link>
        </div>
      )}
    </div>
  )
}
