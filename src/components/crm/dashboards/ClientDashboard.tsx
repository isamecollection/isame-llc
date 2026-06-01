import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import ClientDashboardCharts from './ClientDashboardCharts'
import { StatCard } from '@/components/crm/StatCard'
import { EmptyState } from '@/components/crm/EmptyState'

async function getClientData(userId: string) {
  const payload = await getPayload()
  const userDoc = await payload.findByID({ collection: 'users', id: userId })
  const clientId = (userDoc as any).clientProfile
  if (!clientId) return null

  const accounts = await payload.find({
    collection: 'accounts',
    where: { client: { equals: clientId } },
    depth: 1,
    sort: '-currentBalance',
    limit: 9999,
  })

  const accountIds = accounts.docs.map((a) => a.id)

  const [payments, agreements, legalCases] =
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

  let totalOutstanding = 0
  let totalCollected = 0
  for (const account of accounts.docs) {
    totalOutstanding += account.currentBalance || 0
    totalCollected += account.paymentsReceived || 0
  }

  const today = new Date()
  const dailyCollections: { date: string; amount: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().split('T')[0]
    const nextDayStr = new Date(d.getTime() + 86400000).toISOString().split('T')[0]
    const dayPayments = payments.docs.filter(
      (p) => p.date && p.date >= dayStr && p.date < nextDayStr,
    )
    const amount = dayPayments.reduce((s, p) => s + (p.amount ?? 0), 0)
    dailyCollections.push({ date: dayStr, amount })
  }

  const agreementsKept = agreements.docs.filter(
    (a) => a.status === 'completed' || a.status === 'active',
  ).length
  const agreementsBroken = agreements.docs.filter((a) => a.status === 'breached').length

  const statusCounts: Record<string, number> = {}
  accounts.docs.forEach((acc) => {
    const st = acc.status || 'unknown'
    statusCounts[st] = (statusCounts[st] || 0) + 1
  })

  return {
    totalOutstanding,
    totalCollected,
    accounts: accounts.docs,
    clientId,
    dailyCollections,
    agreementsKept,
    agreementsBroken,
    statusCounts,
    legalCasesCount: legalCases.docs.filter((c) => c.status !== 'closed').length,
  }
}

export default async function ClientDashboard() {
  const headersList = await headers()
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: headersList })
  if (!user) return <p className="text-gray-500">Unauthorized</p>

  const data = await getClientData(user.id)
  if (!data)
    return (
      <EmptyState
        icon="🔗"
        title="No client profile linked"
        description="Your account is not linked to a client profile yet."
      />
    )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Client Portfolio</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Outstanding" value={data.totalOutstanding} isCurrency />
        <StatCard
          title="Total Collected"
          value={data.totalCollected}
          isCurrency
          variant="success"
        />
        <StatCard title="Active Agreements" value={data.agreementsKept} />
        <StatCard
          title="Active Cases"
          value={data.legalCasesCount}
          variant={data.legalCasesCount > 0 ? 'urgent' : 'default'}
        />
      </div>

      <ClientDashboardCharts
        dailyCollections={data.dailyCollections}
        agreementsKept={data.agreementsKept}
        agreementsBroken={data.agreementsBroken}
        statusCounts={data.statusCounts}
      />

      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="text-xl font-semibold">Your Accounts</h2>
        <a
          href={`/api/client-report?clientId=${data.clientId}`}
          target="_blank"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          📄 Export PDF Report
        </a>
      </div>

      {data.accounts.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No accounts yet"
          description="No accounts have been assigned to your portfolio."
        />
      ) : (
        <div className="max-h-125 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Debtor Name</th>
                <th className="px-4 py-3">Account #</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Legal Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.accounts.map((acc: any) => (
                <tr key={acc.id} className="bg-white dark:bg-gray-900">
                  <td className="px-4 py-3">{acc.debtorName || 'Unknown'}</td>
                  <td className="px-4 py-3">{acc.accountNumber}</td>
                  <td className="px-4 py-3">${acc.currentBalance?.toLocaleString()}</td>
                  <td className="px-4 py-3">{acc.status}</td>
                  <td className="px-4 py-3">{acc.legalStatus || '—'}</td>
                  <td className="px-4 py-3">
                    <a href={`/crm/accounts/${acc.id}`} className="text-blue-600 hover:underline">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
