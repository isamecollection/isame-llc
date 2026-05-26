import { getPayload } from '@/payload'
import { CreateClientForm } from '@/components/crm/CreateClientForm'

export default async function ClientsPage() {
  const payload = await getPayload()
  const clients = await payload.find({ collection: 'clients', sort: 'name' })

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
            <strong>{client.name}</strong> ({client.prefix}) – {client.contactPerson || '—'}
          </li>
        ))}
      </ul>
    </div>
  )
}
