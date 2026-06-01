import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { TeamList } from '@/components/crm/supervisor/TeamList'
import { CreateCollectorForm } from '@/components/crm/supervisor/CreateCollectorForm'
import { StatCard } from '@/components/crm/StatCard'

export default async function SupervisorUsersPage() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
  if (!user) return <p className="text-gray-500">Unauthorized</p>

  const team = await payload.find({
    collection: 'users',
    where: { supervisor: { equals: user.id } },
    limit: 9999,
  })

  // Get stats for team
  let totalTeamAccounts = 0
  let totalTeamCollected = 0

  for (const member of team.docs) {
    const accounts = await payload.find({
      collection: 'accounts',
      where: { assignedCollector: { equals: member.id } },
      limit: 9999,
    })
    totalTeamAccounts += accounts.totalDocs
    totalTeamCollected += accounts.docs.reduce((sum, a) => sum + (a.paymentsReceived || 0), 0)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Team</h1>

      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Team Members" value={team.totalDocs} />
        <StatCard title="Total Accounts" value={totalTeamAccounts} />
        <StatCard title="Total Collected" value={totalTeamCollected} isCurrency variant="success" />
      </div>

      {/* Add Collector */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6 shadow-sm">
        <CreateCollectorForm supervisorId={user.id} />
      </div>

      {/* Team List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <TeamList members={team.docs} />
      </div>
    </div>
  )
}
