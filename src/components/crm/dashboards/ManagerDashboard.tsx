import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import ManagerDashboardClient from './ManagerDashboardClient'

export default async function ManagerDashboard() {
  const payload = await getPayload()

  const clients = await payload.find({
    collection: 'clients',
    sort: 'name',
    limit: 9999,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>
      <ManagerDashboardClient clients={clients.docs} />
    </div>
  )
}
