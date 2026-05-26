import { getPayload } from '@/payload'
import { ImportForm } from '@/components/crm/ImportForm'
import { AddAccountForm } from '@/components/crm/AddAccountForm'

export default async function ImportPage() {
  const payload = await getPayload()
  const clients = await payload.find({ collection: 'clients', sort: 'name', limit: 100 })

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Add Accounts</h1>

      {/* Manual add */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <AddAccountForm clients={clients.docs} />
      </section>

      {/* CSV import */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <ImportForm clients={clients.docs} />
      </section>
    </div>
  )
}
