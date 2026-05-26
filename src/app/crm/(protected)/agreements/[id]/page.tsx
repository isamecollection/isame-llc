import { getPayload } from '@/payload'
import { AgreementsTable } from '@/components/crm/AgreementsTable'

export default async function AgreementsPage() {
  const payload = await getPayload()
  const agreements = await payload.find({
    collection: 'agreements',
    limit: 100,
    sort: '-createdAt',
  })

  return <AgreementsTable agreements={agreements.docs} />
}
