// src/components/crm/reports/ClientPortfolio.tsx
import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { getHighestRole } from '@/lib/permissions'
import { StatCard } from '@/components/crm/StatCard'
import ClientDashboardCharts from '@/components/crm/dashboards/ClientDashboardCharts'
import { EmptyState } from '@/components/crm/EmptyState'

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

  // Only show client‑specific data to actual clients
  if (activeRole !== 'client') {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-500">Please select a client to view their portfolio.</p>
      </div>
    )
  }

  // Get the linked client ID
  const userDoc = await payload.findByID({ collection: 'users', id: user.id })
  const clientId =
    typeof userDoc.clientProfile === 'string'
      ? userDoc.clientProfile
      : (userDoc.clientProfile as any)?.id

  if (!clientId) {
    return (
      <EmptyState
        icon="🔗"
        title="No client profile linked"
        description="Your account is not linked to a client profile yet."
      />
    )
  }

  // Fetch accounts for this client
  const { docs: accounts } = await payload.find({
    collection: 'accounts',
    where: { client: { equals: clientId } },
    depth: 1,
    sort: '-currentBalance',
    limit: 9999,
  })

  const accountIds = accounts.map((a) => a.id)

  // Fetch related payments, agreements, legal cases
  const [paymentsRes, agreementsRes, legalCasesRes] =
    accountIds.length > 0
      ? await Promise.all([
          payload.find({
            collection: 'payments',
            where: { status: { equals: 'completed' }, account: { in: accountIds } },
            limit: 9999,
          }),
          payload.find({
            collection: 'agreements',
            where: { account: { in: accountIds } },
            limit: 9999,
          }),
          payload.find({
            collection: 'legal-cases',
            where: { account: { in: accountIds } },
            limit: 9999,
          }),
        ])
      : [{ docs: [] }, { docs: [] }, { docs: [] }]

  const payments = paymentsRes.docs
  const agreements = agreementsRes.docs
  const legalCases = legalCasesRes.docs

  // Compute summary statistics
  let totalOutstanding = 0
  let totalCollectable = 0
  let totalCollected = 0
  let thisMonthCollected = 0

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  for (const acc of accounts) {
    totalOutstanding += acc.currentBalance || 0
    totalCollectable += acc.totalCollectable || 0
    totalCollected += acc.paymentsReceived || 0
  }

  for (const p of payments) {
    if (p.date && p.date >= startOfMonth) {
      thisMonthCollected += p.amount || 0
    }
  }

  // Daily collections for the past 30 days (for the line chart)
  const dailyCollections: { date: string; amount: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().split('T')[0]
    const nextDayStr = new Date(d.getTime() + 86400000).toISOString().split('T')[0]
    const dayPayments = payments.filter((p) => p.date && p.date >= dayStr && p.date < nextDayStr)
    const amount = dayPayments.reduce((s, p) => s + (p.amount ?? 0), 0)
    dailyCollections.push({ date: dayStr, amount })
  }

  const agreementsKept = agreements.filter(
    (a) => a.status === 'completed' || a.status === 'active',
  ).length
  const agreementsBroken = agreements.filter((a) => a.status === 'breached').length

  const statusCounts: Record<string, number> = {}
  accounts.forEach((acc) => {
    const st = acc.status || 'unknown'
    statusCounts[st] = (statusCounts[st] || 0) + 1
  })

  const activeLegalCases = legalCases.filter((c) => c.status !== 'closed').length

  const recentPayments = payments
    .sort(
      (a, b) =>
        new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime(),
    )
    .slice(0, 10)

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Collectable" value={totalCollectable} isCurrency />
        <StatCard title="Total Outstanding" value={totalOutstanding} isCurrency />
        <StatCard title="Total Collected" value={totalCollected} isCurrency variant="success" />
        <StatCard
          title="Collected This Month"
          value={thisMonthCollected}
          isCurrency
          variant="success"
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Accounts" value={accounts.length} />
        <StatCard title="Active Agreements" value={agreementsKept} />
        <StatCard
          title="Active Legal Cases"
          value={activeLegalCases}
          variant={activeLegalCases > 0 ? 'urgent' : 'default'}
        />
        <StatCard
          title="Broken Agreements"
          value={agreementsBroken}
          variant={agreementsBroken > 0 ? 'urgent' : 'default'}
        />
      </div>

      {/* Charts */}
      <ClientDashboardCharts
        dailyCollections={dailyCollections.slice(-7)}
        agreementsKept={agreementsKept}
        agreementsBroken={agreementsBroken}
        statusCounts={statusCounts}
      />

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-3">💳 Recent Payments</h3>
          <div className="max-h-64 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentPayments.map((p: any) => (
                  <tr key={p.id} className="bg-white dark:bg-gray-900">
                    <td className="px-4 py-3">
                      {p.date ? new Date(p.date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">{p.account?.debtorName || '—'}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">
                      ${p.amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 capitalize">{p.method || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Accounts (collapsible) */}
      <details className="mt-6">
        <summary className="cursor-pointer text-lg font-semibold text-blue-600 hover:text-blue-800">
          📋 View All Accounts ({accounts.length})
        </summary>
        <div className="max-h-125 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg mt-3">
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
      </details>
    </div>
  )
}
