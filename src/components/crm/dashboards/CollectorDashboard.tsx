import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { CollectorQueue } from '@/components/crm/CollectorQueue'

async function getCollectorStats() {
  const payload = await getPayload()
  const headersList = await headers()
  const cookieStore = await cookies()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) return null

  const assignedAccounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [{ status: { equals: 'active' } }, { assignedCollector: { equals: user.id } }],
    },
    limit: 500,
  })

  const totalOutstanding = assignedAccounts.docs.reduce(
    (sum, acc) => sum + (acc.currentBalance ?? 0),
    0,
  )

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const paymentsThisMonth = await payload.find({
    collection: 'payments',
    where: {
      and: [
        { status: { equals: 'completed' } },
        { collectedBy: { equals: user.id } },
        { date: { greater_than_equal: startOfMonth } },
        { date: { less_than_equal: endOfMonth } },
      ],
    },
  })

  const totalCollectedThisMonth = paymentsThisMonth.docs.reduce(
    (sum, p) => sum + (p.amount ?? 0),
    0,
  )

  // Broken promises today: missed scheduled payments for their assigned accounts
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const brokenToday = await payload.count({
    collection: 'scheduled-payments',
    where: {
      and: [
        { status: { equals: 'missed' } },
        { updatedAt: { greater_than: todayISO } },
        { account: { in: assignedAccounts.docs.map((a) => a.id) } },
      ],
    },
  })

  return {
    totalOutstanding,
    totalCollectedThisMonth,
    brokenToday: brokenToday.totalDocs,
    user,
  }
}

export default async function CollectorDashboard() {
  const stats = await getCollectorStats()
  if (!stats) return <p className="text-gray-500">Unable to load collector stats.</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Collector Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Outstanding" value={stats.totalOutstanding} />
        <StatCard title="Collected This Month" value={stats.totalCollectedThisMonth} />
        <StatCard title="Broken Promises Today" value={stats.brokenToday} />
      </div>

      <h2 className="text-xl font-semibold mb-3">Work Queue</h2>
      <CollectorQueue collectorId={stats.user.id} />
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
    </div>
  )
}
