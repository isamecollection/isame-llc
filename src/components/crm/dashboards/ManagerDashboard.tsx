import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import ManagerDashboardClient from './ManagerDashboardClient'

export default async function ManagerDashboard() {
  const payload = await getPayload()

  // Fetch all clients for the dropdown
  const clients = await payload.find({ collection: 'clients', sort: 'name' })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>
      <ManagerDashboardClient clients={clients.docs} />
    </div>
  )
}
