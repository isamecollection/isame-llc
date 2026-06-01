import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { TeamList } from '@/components/crm/supervisor/TeamList'
import { CreateCollectorForm } from '@/components/crm/supervisor/CreateCollectorForm'

export default async function SupervisorUsersPage() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
  if (!user) return <p className="text-gray-500">Unauthorized</p>

  const team = await payload.find({
    collection: 'users',
    where: { supervisor: { equals: user.id } },
    limit: 9999,
  })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Team</h1>
      <CreateCollectorForm supervisorId={user.id} />
      <TeamList members={team.docs} />
    </div>
  )
}
