import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { CollectorQueue } from '@/components/crm/CollectorQueue'
import { EmptyState } from '@/components/crm/EmptyState'
import { StatCard } from '@/components/crm/StatCard'

async function getCollectorStats() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) return null

  const assignedAccounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [{ status: { equals: 'active' } }, { assignedCollector: { equals: user.id } }],
    },
    limit: 9999,
  })

  let totalCollectable = 0
  let totalOutstanding = 0

  for (const account of assignedAccounts.docs) {
    // Fallback to currentBalance if totalCollectable is missing
    totalCollectable += account.totalCollectable || account.currentBalance || 0
    totalOutstanding += account.currentBalance ?? 0
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  // Get payments for this collector's accounts (by account, not collectedBy)
  const accountIds = assignedAccounts.docs.map((a) => a.id)

  const paymentsThisMonth =
    accountIds.length > 0
      ? await payload.find({
          collection: 'payments',
          where: {
            and: [
              { status: { equals: 'completed' } },
              { account: { in: accountIds } },
              { date: { greater_than_equal: startOfMonth } },
              { date: { less_than_equal: endOfMonth } },
            ],
          },
          limit: 9999,
        })
      : { docs: [] }

  const totalCollectedThisMonth = paymentsThisMonth.docs.reduce(
    (sum, p) => sum + (p.amount ?? 0),
    0,
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const brokenToday =
    accountIds.length > 0
      ? await payload.count({
          collection: 'scheduled-payments',
          where: {
            and: [
              { status: { equals: 'missed' } },
              { updatedAt: { greater_than: todayISO } },
              { account: { in: accountIds } },
            ],
          },
        })
      : { totalDocs: 0 }

  return {
    totalCollectable,
    totalOutstanding,
    totalCollectedThisMonth,
    brokenToday: brokenToday.totalDocs,
    accountCount: assignedAccounts.totalDocs,
    user,
  }
}

export default async function CollectorDashboard() {
  const stats = await getCollectorStats()
  if (!stats) return <p className="text-gray-500">Unable to load collector stats.</p>

  if (stats.accountCount === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Collector Dashboard</h1>
        <EmptyState
          icon="📋"
          title="No accounts assigned yet"
          description="Accounts will appear here once your supervisor assigns them to you. Check back soon!"
        />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Collector Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total to Collect" value={stats.totalCollectable} isCurrency />
        <StatCard title="Total Outstanding" value={stats.totalOutstanding} isCurrency />
        <StatCard
          title="Collected This Month"
          value={stats.totalCollectedThisMonth}
          isCurrency
          variant="success"
        />
        <StatCard title="Broken Promises Today" value={stats.brokenToday} variant="urgent" />
      </div>

      <h2 className="text-xl font-semibold mb-3">Work Queue</h2>
      <CollectorQueue collectorId={stats.user.id} />
    </div>
  )
}
