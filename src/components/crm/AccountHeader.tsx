import Link from 'next/link'

export function AccountHeader({ account }: { account: any }) {
  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold">{account.debtorName || 'Account'}</h1>
      <p className="text-3xl font-bold mt-2">
        Balance: ${account.currentBalance?.toLocaleString()}
      </p>
      {account.ssn && (
        <p className="mt-1">
          SSN:{' '}
          <Link
            href={`/crm/debtors/${account.ssn}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {account.ssn}
          </Link>
        </p>
      )}
      <div className="mt-3">
        <Link
          href={`/crm/accounts/${account.id}/merge`}
          className="text-red-600 dark:text-red-400 hover:underline text-sm"
        >
          Merge Account
        </Link>
      </div>
    </div>
  )
}
