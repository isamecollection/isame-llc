import { getPayload } from '@/payload'

export default async function AdminDashboard() {
  const payload = await getPayload()

  const activeAccounts = await payload.count({
    collection: 'accounts',
    where: { status: { equals: 'active' } },
  })
  const totalUsers = await payload.count({ collection: 'users' })

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        }}
      >
        <StatCard title="Active Accounts" value={activeAccounts.totalDocs} />
        <StatCard title="Total Users" value={totalUsers.totalDocs} />
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: 8 }}>
      <h3>{title}</h3>
      <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{value}</p>
    </div>
  )
}
