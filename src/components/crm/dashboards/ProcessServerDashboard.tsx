import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import Link from 'next/link'

export default async function ProcessServerDashboard() {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return <p className="text-gray-500">Not authorized</p>

  // Only assigned accounts where serviceStatus is 'pending_service'
  const accounts = await payload.find({
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Process Server Dashboard</h1>
      <h2 className="text-xl font-semibold mb-3">Accounts Assigned for Service</h2>
      {accounts.docs.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No accounts assigned for service.</p>
      ) : (
        <div className="space-y-2">
          {accounts.docs.map((account: any) => (
            <Link
              key={account.id}
              href={`/crm/accounts/${account.id}`}
              className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {account.debtorName || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {account.accountNumber} – {account.address || 'No address'}
                  </p>
                </div>
                <span className="text-blue-600 dark:text-blue-400">View →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
