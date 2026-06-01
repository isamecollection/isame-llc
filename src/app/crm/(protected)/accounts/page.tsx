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

  const isManagement = ['supervisor', 'crm-manager', 'claims-officer', 'admin'].includes(activeRole)
  const isCourtAgent = activeRole === 'court-agent'
  const isProcessServer = activeRole === 'process-server'
  const isCollector = activeRole === 'collector'

  // Base filter based on role
  const baseFilter: any = {}

  if (isManagement) {
    // Management sees all active accounts
    baseFilter.status = { equals: 'active' }
  } else if (isCourtAgent) {
    // Court agent only sees accounts assigned to them
    baseFilter.assignedCourtAgent = { equals: user.id }
  } else if (isProcessServer) {
    // Process server only sees accounts assigned to them
    baseFilter.assignedProcessServer = { equals: user.id }
    baseFilter.serviceStatus = { equals: 'pending_service' }
  } else if (isCollector) {
    // Collector only sees accounts assigned to them
    baseFilter.status = { equals: 'active' }
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
