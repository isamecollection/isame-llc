import { getPayload } from '@/payload'
import { notFound } from 'next/navigation'

export default async function DebtorHistoryPage({ params }: { params: Promise<{ ssn: string }> }) {
  const { ssn } = await params
  const payload = await getPayload()

  const accounts = await payload.find({
    collection: 'accounts',
    where: { ssn: { equals: ssn } },
    sort: '-createdAt',
    depth: 1, // populate client
  })

  if (accounts.totalDocs === 0) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Debtor History – SSN: {ssn}</h1>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Total accounts found: {accounts.totalDocs}
      </p>

      <div className="max-h-125 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 font-semibold">Debtor Name</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Account #</th>
              <th className="px-4 py-3 font-semibold">Balance</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Assigned Collector</th>
              <th className="px-4 py-3 font-semibold">Added</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {accounts.docs.map((account: any) => (
              <tr
                key={account.id}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-4 py-3">{account.debtorName || 'Unknown'}</td>
                <td className="px-4 py-3">{(account.client as any)?.name || '—'}</td>
                <td className="px-4 py-3">{account.accountNumber}</td>
                <td className="px-4 py-3">${account.currentBalance?.toLocaleString()}</td>
                <td className="px-4 py-3">{account.status}</td>
                <td className="px-4 py-3">
                  {account.assignedCollector
                    ? (account.assignedCollector as any)?.name || account.assignedCollector
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/crm/accounts/${account.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
