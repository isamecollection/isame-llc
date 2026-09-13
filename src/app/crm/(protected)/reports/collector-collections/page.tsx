import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveRole } from '@/lib/getActiveRole'
import { CollectorCollections } from '@/components/crm/reports/CollectorCollections'

export default async function CollectorCollectionsPage() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) redirect('/crm/login')

  const activeRole = await getActiveRole(user)
  const allowed = ['admin', 'crm-manager', 'supervisor'].includes(activeRole)

  if (!allowed) {
    return (
      <div className="p-8 text-center text-gray-500">You do not have access to this report.</div>
    )
  }

  // Load users and clients for the filters
  const usersRes = await payload.find({
    collection: 'users',
    limit: 9999,
    sort: 'name',
    depth: 0,
  })

  const clientsRes = await payload.find({
    collection: 'clients',
    limit: 9999,
    sort: 'name',
    depth: 0,
  })

  const users = usersRes.docs.map((u: any) => ({
    id: u.id,
    name: u.name || u.email || 'Unknown',
    roles: u.roles || [],
  }))

  const clients = clientsRes.docs.map((c: any) => ({
    id: c.id,
    name: c.name || 'Unnamed',
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Collector Collections</h1>
      <p className="text-sm text-gray-500 mb-6">
        Per-collector breakdown of payments collected. Shows ISAME's 20% share and the client's 80%
        share. Export as PDF (one page per collector) or CSV.
      </p>
      <CollectorCollections users={users} clients={clients} />
    </div>
  )
}
