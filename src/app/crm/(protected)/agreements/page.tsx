import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AgreementsTable } from '@/components/crm/AgreementsTable'

export default async function AgreementsPage() {
  // Authenticate
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    redirect('/crm/login')
  }

  const agreements = await payload.find({
    collection: 'agreements',
    limit: 100,
    sort: '-createdAt',
  })

  return <AgreementsTable agreements={agreements.docs} />
}
