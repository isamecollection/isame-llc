// src/components/crm/reports/ClientPortfolio.tsx
import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { getHighestRole } from '@/lib/permissions'

export default async function ClientPortfolio() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) return <p className="text-gray-500">Not authenticated</p>

  const cookieStore = await cookies()
  const roles: string[] = user.roles ?? []
  const activeRoleCookie = cookieStore.get('activeRole')?.value
  const activeRole =
    activeRoleCookie && roles.includes(activeRoleCookie) ? activeRoleCookie : getHighestRole(roles)

  // Only fetch client-specific data if the user is a client
  let accounts: any[] = []
  if (activeRole === 'client') {
    const userDoc = await payload.findByID({ collection: 'users', id: user.id })
    const clientId =
      typeof userDoc.clientProfile === 'string'
        ? userDoc.clientProfile
        : (userDoc.clientProfile as any)?.id

    if (clientId) {
      const res = await payload.find({
        collection: 'accounts',
        where: { client: { equals: clientId } },
        limit: 9999,
        sort: '-currentBalance',
      })
      accounts = res.docs
    }
  } else {
    // For non-clients, fetch all accounts (or keep existing logic)
    const res = await payload.find({
      collection: 'accounts',
      limit: 9999,
      sort: '-currentBalance',
    })
    accounts = res.docs
  }

  return (
    <div className="max-h-125 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 sticky top-0">
          <tr>
            <th className="px-4 py-3">Debtor Name</th>
            <th className="px-4 py-3">Account #</th>
            <th className="px-4 py-3">Balance</th>
            <th className="px-4 py-3">Total Collectable</th>
            <th className="px-4 py-3">Paid</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {accounts.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-500">
                No accounts found.
              </td>
            </tr>
          ) : (
            accounts.map((acc: any) => (
              <tr
                key={acc.id}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-4 py-3 font-medium">{acc.debtorName || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{acc.accountNumber}</td>
                <td className="px-4 py-3">${acc.currentBalance?.toLocaleString()}</td>
                <td className="px-4 py-3">${acc.totalCollectable?.toLocaleString()}</td>
                <td className="px-4 py-3 text-green-600">
                  ${acc.paymentsReceived?.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      acc.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : acc.status === 'legal'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {acc.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
