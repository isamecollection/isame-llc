import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import SupervisorDashboardClient from './SupervisorDashboardClient'

export default async function SupervisorDashboard() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
  if (!user) return <p className="text-gray-500">Not authorized</p>

  const team = await payload.find({
    collection: 'users',
    where: {
      and: [{ supervisor: { equals: user.id } }, { roles: { contains: 'collector' } }],
    },
    limit: 9999,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Supervisor Dashboard</h1>
      <SupervisorDashboardClient team={team.docs} />
    </div>
  )
}
