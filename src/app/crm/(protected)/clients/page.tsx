import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { CreateClientForm } from '@/components/crm/CreateClientForm'
import { EditClientForm } from '@/components/crm/EditClientForm'
import { ArchiveClientButton } from '@/components/crm/ArchiveClientButton'

export default async function ClientsPage() {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  const clients = await payload.find({
    collection: 'clients',
    where: { archived: { equals: false } },
    sort: 'name',
  })

  const canManage = user?.roles?.some((r: string) => ['admin', 'crm-manager'].includes(r)) ?? false

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Clients</h1>
      <CreateClientForm />

      <h2 className="text-xl font-semibold mt-8 mb-3">All Clients</h2>
      <ul className="space-y-2">
        {clients.docs.map((client: any) => (
          <li
            key={client.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <strong>{client.name}</strong> ({client.prefix})
                {client.contactPerson && <span> – {client.contactPerson}</span>}
                {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
                {client.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
              </div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <EditClientForm client={client} />
                  <ArchiveClientButton clientId={client.id} archived={client.archived} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
