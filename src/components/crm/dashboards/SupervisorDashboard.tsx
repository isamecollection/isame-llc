import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { PerformanceCharts } from '@/components/crm/supervisor/PerformanceCharts'

export default async function SupervisorDashboard() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
  if (!user) return <p className="text-gray-500">Not authorized</p>

  // Get team members (collectors whose supervisor is the current user)
  const team = await payload.find({
    collection: 'users',
    where: {
      and: [{ supervisor: { equals: user.id } }, { roles: { contains: 'collector' } }],
    },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  let totalBrokenPromises = 0

  const teamStats = await Promise.all(
    team.docs.map(async (member: any) => {
      // Get assigned active accounts for this collector
      const assignedAccounts = await payload.find({
        collection: 'accounts',
        where: {
          and: [{ status: { equals: 'active' } }, { assignedCollector: { equals: member.id } }],
        },
        limit: 500,
      })

      const accountsCount = assignedAccounts.totalDocs

      // Count broken promises today for this collector's accounts
      const brokenToday = await payload.count({
        collection: 'scheduled-payments',
        where: {
          and: [
            { status: { equals: 'missed' } },
            { updatedAt: { greater_than: todayISO } },
            {
              account: {
                in: assignedAccounts.docs.map((a) => a.id),
              },
            },
          ],
        },
      })

      totalBrokenPromises += brokenToday.totalDocs

      // Also count notes and calls today
      const notesToday = await payload.count({
        collection: 'notes',
        where: {
          and: [{ createdBy: { equals: member.id } }, { createdAt: { greater_than: todayISO } }],
        },
      })

      const callsToday = await payload.count({
        collection: 'call-attempts',
        where: {
          and: [{ createdBy: { equals: member.id } }, { createdAt: { greater_than: todayISO } }],
        },
      })

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        accountsCount,
        notesToday: notesToday.totalDocs,
        callsToday: callsToday.totalDocs,
        brokenToday: brokenToday.totalDocs,
      }
    }),
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Supervisor Dashboard</h1>

      {/* Team summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Team Members" value={team.totalDocs} />
        <StatCard
          title="Total Active Accounts"
          value={teamStats.reduce((sum, s) => sum + s.accountsCount, 0)}
        />
        <StatCard title="Team Broken Promises Today" value={totalBrokenPromises} />
        <StatCard
          title="Total Calls Today"
          value={teamStats.reduce((sum, s) => sum + s.callsToday, 0)}
        />
      </div>

      <h2 className="text-xl font-semibold mb-3">Team Performance</h2>

      {teamStats.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No collectors assigned to you.</p>
      ) : (
        <div className="max-h-125 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Collector</th>
                <th className="px-4 py-3 font-semibold">Active Accounts</th>
                <th className="px-4 py-3 font-semibold">Broken Promises Today</th>
                <th className="px-4 py-3 font-semibold">Notes Today</th>
                <th className="px-4 py-3 font-semibold">Calls Today</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {teamStats.map((s) => (
                <tr
                  key={s.id}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">{s.accountsCount}</td>
                  <td className="px-4 py-3">
                    <span className={s.brokenToday > 0 ? 'text-red-600 font-semibold' : ''}>
                      {s.brokenToday}
                    </span>
                  </td>
                  <td className="px-4 py-3">{s.notesToday}</td>
                  <td className="px-4 py-3">{s.callsToday}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/crm/accounts?collector=${s.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Accounts
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Performance Charts */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Performance Trends</h2>
      <PerformanceCharts supervisorId={user.id} />
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
