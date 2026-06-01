import { getPayload } from '@/payload'
import Link from 'next/link'
import { EmptyState } from '@/components/crm/EmptyState'
import { StatCard } from '@/components/crm/StatCard'
import { AssignDropdown } from '@/components/crm/AssignDropdown'

export default async function ClaimsOfficerDashboard() {
  const payload = await getPayload()

  // 1. Accounts pending legal review
  const pendingAccounts = await payload.find({
    collection: 'accounts',
    where: { legalStatus: { equals: 'pending_review' } },
    sort: '-currentBalance',
    depth: 1,
  })

  // 2. NEW: Accounts with court documents not yet assigned
  const courtReadyAccounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [
        {
          or: [
            { suitNo: { exists: true, not_equals: '' } },
            { courtReceiptNo: { exists: true, not_equals: '' } },
          ],
        },
        { legalStatus: { not_equals: 'assigned' } },
      ],
    },
    sort: '-currentBalance',
    depth: 1,
  })

  // 3. Court agents & process servers
  const courtAgents = await payload.find({
    collection: 'users',
    where: { roles: { contains: 'court-agent' } },
    sort: 'name',
  })

  const processServers = await payload.find({
    collection: 'users',
    where: { roles: { contains: 'process-server' } },
    sort: 'name',
  })

  // 4. Active legal cases
  const activeCases = await payload.find({
    collection: 'legal-cases',
    where: { status: { not_equals: 'closed' } },
    sort: '-createdAt',
    depth: 2,
  })

  const hasData =
    pendingAccounts.totalDocs > 0 || courtReadyAccounts.totalDocs > 0 || activeCases.totalDocs > 0

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Claims Officer Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Pending Review" value={pendingAccounts.totalDocs} variant="warning" />
        <StatCard title="Court Ready" value={courtReadyAccounts.totalDocs} variant="urgent" />
        <StatCard title="Active Cases" value={activeCases.totalDocs} />
        <StatCard title="Court Agents" value={courtAgents.totalDocs} />
      </div>

      {!hasData ? (
        <EmptyState
          icon="⚖️"
          title="No cases to review"
          description="Import accounts with court documents or flag accounts for legal review to see them here."
          action={{ label: 'Import Accounts', href: '/crm/import' }}
        />
      ) : (
        <>
          {/* Court Ready Accounts */}
          {courtReadyAccounts.totalDocs > 0 && (
            <>
              <h2 className="text-xl font-semibold mb-3">📋 Court Ready Accounts</h2>
              <div className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg mb-8">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Debtor</th>
                      <th className="px-4 py-3 font-semibold">Account #</th>
                      <th className="px-4 py-3 font-semibold">Balance</th>
                      <th className="px-4 py-3 font-semibold">Suit No.</th>
                      <th className="px-4 py-3 font-semibold">Assign Agent</th>
                      <th className="px-4 py-3 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {courtReadyAccounts.docs.map((account: any) => (
                      <tr
                        key={account.id}
                        className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-4 py-3 font-medium">{account.debtorName || 'Unknown'}</td>
                        <td className="px-4 py-3 text-gray-500">{account.accountNumber}</td>
                        <td className="px-4 py-3">${account.currentBalance?.toLocaleString()}</td>
                        <td className="px-4 py-3">{account.suitNo || '—'}</td>
                        <td className="px-4 py-3">
                          <AssignDropdown
                            accountId={account.id}
                            currentValue={account.assignedCourtAgent}
                            agents={courtAgents.docs}
                            field="assignedCourtAgent"
                            statusAfter="assigned"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/crm/accounts/${account.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pending Review */}
          <h2 className="text-xl font-semibold mb-3">⚠️ Accounts Pending Legal Review</h2>
          {pendingAccounts.totalDocs === 0 ? (
            <EmptyState icon="✅" title="All reviewed" description="No accounts pending review." />
          ) : (
            <div className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg mb-8">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Debtor</th>
                    <th className="px-4 py-3 font-semibold">Account #</th>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Balance</th>
                    <th className="px-4 py-3 font-semibold">Court Agent</th>
                    <th className="px-4 py-3 font-semibold">Process Server</th>
                    <th className="px-4 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingAccounts.docs.map((account: any) => (
                    <tr
                      key={account.id}
                      className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3">{account.debtorName || 'Unknown'}</td>
                      <td className="px-4 py-3">{account.accountNumber}</td>
                      <td className="px-4 py-3">{(account.client as any)?.name || '—'}</td>
                      <td className="px-4 py-3">${account.currentBalance?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <AssignDropdown
                          accountId={account.id}
                          currentValue={account.assignedCourtAgent}
                          agents={courtAgents.docs}
                          field="assignedCourtAgent"
                          statusAfter="assigned"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <AssignDropdown
                          accountId={account.id}
                          currentValue={account.assignedProcessServer}
                          agents={processServers.docs}
                          field="assignedProcessServer"
                          statusAfter="pending_service"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/crm/accounts/${account.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Active Legal Cases */}
          <h2 className="text-xl font-semibold mb-3">⚖️ Active Legal Cases</h2>
          {activeCases.totalDocs === 0 ? (
            <EmptyState
              icon="⚖️"
              title="No active cases"
              description="Legal cases will appear here once created."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeCases.docs.map((c: any) => {
                const now = new Date()
                const nextEvent = (c.courtEvents || [])
                  .filter((ev: any) => new Date(ev.eventDate) > now)
                  .sort(
                    (a: any, b: any) =>
                      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
                  )[0]

                return (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {c.account?.debtorName || 'Unknown Debtor'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {c.account?.accountNumber}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 capitalize">
                        {c.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                      {c.caseNumber && (
                        <p>
                          <span className="font-medium">Case #:</span> {c.caseNumber}
                        </p>
                      )}
                      {c.court && (
                        <p>
                          <span className="font-medium">Court:</span> {c.court}
                        </p>
                      )}
                      {c.assignedTo && (
                        <p>
                          <span className="font-medium">Agent:</span>{' '}
                          {(c.assignedTo as any)?.name || c.assignedTo}
                        </p>
                      )}
                    </div>
                    {nextEvent ? (
                      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300 mb-1">
                          Next Event
                        </p>
                        <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                          {new Date(nextEvent.eventDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 capitalize">
                          {nextEvent.eventType}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          No upcoming events
                        </p>
                      </div>
                    )}
                    <Link
                      href={`/crm/accounts/${c.account?.id}`}
                      className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      View Account →
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
