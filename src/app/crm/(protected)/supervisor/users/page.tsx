import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { TeamList } from '@/components/crm/supervisor/TeamList'
import { CreateCollectorForm } from '@/components/crm/supervisor/CreateCollectorForm'

export default async function SupervisorUsersPage() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
  if (!user) return <p>Unauthorized</p>

  const team = await payload.find({
    collection: 'users',
    where: { supervisor: { equals: user.id } },
  })

  return (
    <div>
      <h1>Manage Team</h1>
      <CreateCollectorForm supervisorId={user.id} />
      <TeamList members={team.docs} />
    </div>
  )
}
