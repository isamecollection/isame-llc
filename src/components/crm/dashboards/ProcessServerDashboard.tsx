import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ServiceActions } from '@/components/crm/ServiceActions'

export default async function ProcessServerDashboard() {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return <p className="text-gray-500">Not authorized</p>

  // Accounts assigned to this process server with pending_service status
  const pendingAccounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [
        { assignedProcessServer: { equals: user.id } },
        { serviceStatus: { equals: 'pending_service' } },
      ],
    },
    sort: '-currentBalance',
    depth: 1,
  })

  // Recently served accounts
  const servedAccounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [
        { assignedProcessServer: { equals: user.id } },
        { serviceStatus: { equals: 'served' } },
      ],
    },
    sort: '-updatedAt',
    limit: 10,
    depth: 1,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Process Server Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Service</h3>
          <p className="text-3xl font-bold mt-1">{pendingAccounts.totalDocs}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Served</h3>
          <p className="text-3xl font-bold mt-1">{servedAccounts.totalDocs}</p>
        </div>
      </div>

      {/* Pending Service */}
      <h2 className="text-xl font-semibold mb-3">📋 Accounts to Serve</h2>
      {pendingAccounts.docs.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 mb-8">No accounts assigned for service.</p>
      ) : (
        <div className="space-y-4 mb-8">
          {pendingAccounts.docs.map((account: any) => (
            <div
              key={account.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                      {account.debtorName || 'Unknown'}
                    </h3>
                    <span className="text-xs text-gray-500">#{account.accountNumber}</span>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold uppercase text-yellow-700 dark:text-yellow-300 mb-1">
                      📍 Service Address
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                      {account.street || account.address || 'No address provided'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {[account.townCity, account.district].filter(Boolean).join(', ')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Balance:</span> $
                      {account.currentBalance?.toLocaleString()}
                    </div>
                    {account.suitNo && (
                      <div>
                        <span className="font-medium">Suit No:</span> {account.suitNo}
                      </div>
                    )}
                    {account.courtReceiptNo && (
                      <div>
                        <span className="font-medium">Court Receipt:</span> {account.courtReceiptNo}
                      </div>
                    )}
                    {account.lodge && (
                      <div>
                        <span className="font-medium">Lodge:</span> {account.lodge}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-55">
                  <ServiceActions accountId={account.id} />
                  <Link
                    href={`/crm/accounts/${account.id}`}
                    className="text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Full Account →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recently Served */}
      {servedAccounts.docs.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-3">✅ Recently Served</h2>
          <div className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Debtor</th>
                  <th className="px-4 py-3 font-semibold">Account #</th>
                  <th className="px-4 py-3 font-semibold">Address</th>
                  <th className="px-4 py-3 font-semibold">Served</th>
                  <th className="px-4 py-3 font-semibold">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {servedAccounts.docs.map((account: any) => (
                  <tr
                    key={account.id}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 font-medium">{account.debtorName || 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-500">{account.accountNumber}</td>
                    <td className="px-4 py-3 text-xs">
                      {[account.street, account.townCity].filter(Boolean).join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      {account.serviceDate
                        ? new Date(account.serviceDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {account.serviceProof ? (
                        <span className="text-green-600 dark:text-green-400">✓ Yes</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
