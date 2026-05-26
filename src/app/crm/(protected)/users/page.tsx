import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CreateUserForm } from '@/components/crm/users/CreateUserForm'
import { UserList } from '@/components/crm/users/UserList'

export default async function UsersPage() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user || !user.roles?.some((r) => ['crm-manager', 'admin'].includes(r))) {
    redirect('/crm/dashboard')
  }

  const allUsers = await payload.find({
    collection: 'users',
    sort: 'name',
    limit: 100,
  })

  const supervisors = await payload.find({
    collection: 'users',
    where: { roles: { contains: 'supervisor' } },
    sort: 'name',
  })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <CreateUserForm supervisors={supervisors.docs} />
      <UserList users={allUsers.docs} />
    </div>
  )
}
