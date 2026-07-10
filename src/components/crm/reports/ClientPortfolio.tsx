import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { getHighestRole } from '@/lib/permissions'
import { StatCard } from '@/components/crm/StatCard'
import { getActiveRole } from '@/lib/getActiveRole'
import ClientDashboardCharts from '@/components/crm/dashboards/ClientDashboardCharts'

export default async function ClientPortfolio() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) return <p className="text-gray-500">Not authenticated</p>

  const cookieStore = await cookies()
  const roles: string[] = user.roles ?? []
  const activeRole = await getActiveRole(user)
  // Only clients should access this report
  if (activeRole !== 'client') {
    return <p className="text-gray-500">This report is only available to clients.</p>
  }

  const userDoc = await payload.findByID({ collection: 'users', id: user.id })
  const clientId =
    typeof userDoc.clientProfile === 'string'
      ? userDoc.clientProfile
      : (userDoc.clientProfile as any)?.id

  if (!clientId) {
    return <p className="text-gray-500">No client profile linked to your account.</p>
  }

  // Fetch client accounts
  const { docs: accounts } = await payload.find({
    collection: 'accounts',
    where: { client: { equals: clientId } },
    depth: 0,
    sort: '-currentBalance',
    limit: 9999,
  })

  const accountIds = accounts.map((a) => a.id)

  // Fetch payments and legal cases
  const [paymentsRes, legalCasesRes] = await Promise.all([
    payload.find({
      collection: 'payments',
      where: { status: { equals: 'completed' }, account: { in: accountIds } },
      limit: 9999,
    }),
    payload.find({
      collection: 'legal-cases',
      where: { account: { in: accountIds } },
      limit: 9999,
    }),
  ])

  const payments = paymentsRes.docs
  const legalCases = legalCasesRes.docs

  // Calculate summary stats
  const totalOutstanding = accounts.reduce((s, a) => s + (a.currentBalance || 0), 0)
  const totalCollected = accounts.reduce((s, a) => s + (a.paymentsReceived || 0), 0)
  const totalCollectable = accounts.reduce((s, a) => s + (a.totalCollectable || 0), 0)
  const activeLegalCases = legalCases.filter((c) => c.status !== 'closed').length

  // Daily collections for last 7 days (for chart)
  const now = new Date()
  const dailyCollections: { date: string; amount: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().split('T')[0]
    const nextDayStr = new Date(d.getTime() + 86400000).toISOString().split('T')[0]
    const dayPayments = payments.filter((p) => p.date && p.date >= dayStr && p.date < nextDayStr)
    const amount = dayPayments.reduce((s, p) => s + (p.amount ?? 0), 0)
    dailyCollections.push({ date: dayStr, amount })
  }

  const statusCounts: Record<string, number> = {}
  accounts.forEach((a) => {
    const st = a.status || 'unknown'
    statusCounts[st] = (statusCounts[st] || 0) + 1
  })

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Outstanding" value={totalOutstanding} isCurrency />
        <StatCard title="Total Collected" value={totalCollected} isCurrency variant="success" />
        <StatCard title="Total Collectable" value={totalCollectable} isCurrency />
        <StatCard
          title="Active Legal Cases"
          value={activeLegalCases}
          variant={activeLegalCases > 0 ? 'urgent' : 'default'}
        />
      </div>

      {/* Charts (last 7 days) */}
      <ClientDashboardCharts
        dailyCollections={dailyCollections}
        agreementsKept={0}
        agreementsBroken={0}
        statusCounts={statusCounts}
      />

      {/* Full account list (collapsible) */}
      <details>
        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
          View all accounts ({accounts.length})
        </summary>
        <div className="mt-2 max-h-64 overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="px-4 py-2">Debtor</th>
                <th className="px-4 py-2">Account #</th>
                <th className="px-4 py-2">Balance</th>
                <th className="px-4 py-2">Paid</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accounts.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2">{a.debtorName}</td>
                  <td className="px-4 py-2">{a.accountNumber}</td>
                  <td className="px-4 py-2">${a.currentBalance?.toLocaleString()}</td>
                  <td className="px-4 py-2">${a.paymentsReceived?.toLocaleString()}</td>
                  <td className="px-4 py-2">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
