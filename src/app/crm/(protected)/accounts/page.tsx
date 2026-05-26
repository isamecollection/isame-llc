import { headers, cookies } from 'next/headers'
import { getPayload } from '@/payload'
import { FilterableAccountsTable } from '@/components/crm/FilterableAccountsTable'

export default async function AccountsPage() {
  const payload = await getPayload()
  const headersList = await headers()
  const cookieStore = await cookies()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) return <p className="text-gray-500">Unauthorized</p>

  const activeRole = cookieStore.get('activeRole')?.value || user.roles?.[0] || 'collector'
  const isManagement = ['supervisor', 'crm-manager', 'court-agent', 'admin'].includes(activeRole)
  const isCollector = activeRole === 'collector'

  // Base filter: active accounts; for collector, only assigned
  const baseFilter: any = { status: { equals: 'active' } }
  if (!isManagement && isCollector) {
    baseFilter.assignedCollector = { equals: user.id }
  }

  // Fetch collectors for assignment dropdown (only for management)
  let collectors: any[] = []
  if (isManagement) {
    const res = await payload.find({
      collection: 'users',
      where: { roles: { contains: 'collector' } },
      sort: 'name',
    })
    collectors = res.docs
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Accounts</h1>
      <FilterableAccountsTable
        baseFilter={baseFilter}
        showAssignment={isManagement}
        collectors={collectors}
      />
    </div>
  )
}
