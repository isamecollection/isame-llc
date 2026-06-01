import { getPayload } from '@/payload'
import { StatCard } from '@/components/crm/StatCard'

export default async function AdminDashboard() {
  const payload = await getPayload()

  const activeAccounts = await payload.count({
    collection: 'accounts',
    where: { status: { equals: 'active' } },
  })
  const totalUsers = await payload.count({ collection: 'users' })
  const totalClients = await payload.count({ collection: 'clients' })

  const legalCases = await payload.count({
    collection: 'legal-cases',
    where: { status: { not_equals: 'closed' } },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Accounts" value={activeAccounts.totalDocs} />
        <StatCard title="Total Users" value={totalUsers.totalDocs} />
        <StatCard title="Total Clients" value={totalClients.totalDocs} />
        <StatCard title="Active Legal Cases" value={legalCases.totalDocs} variant="urgent" />
      </div>
    </div>
  )
}
