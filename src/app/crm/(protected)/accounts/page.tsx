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

  const isManagement = ['supervisor', 'crm-manager', 'admin'].includes(activeRole)
  const isClaimsOfficer = activeRole === 'claims-officer'
  const isCourtAgent = activeRole === 'court-agent'
  const isProcessServer = activeRole === 'process-server'
  const isCollector = activeRole === 'collector'

  const baseFilter: any = {}

  if (isManagement) {
    baseFilter.status = { equals: 'active' }
  } else if (isClaimsOfficer) {
    baseFilter.status = { equals: 'legal' }
  } else if (isCourtAgent) {
    baseFilter.assignedCourtAgent = { equals: user.id }
  } else if (isProcessServer) {
    baseFilter.assignedProcessServer = { equals: user.id }
    baseFilter.serviceStatus = { equals: 'pending_service' }
  } else if (isCollector) {
    baseFilter.status = { equals: 'active' }
    baseFilter.assignedCollector = { equals: user.id }
  }

  // Fetch collectors for management
  let collectors: any[] = []
  if (isManagement) {
    const res = await payload.find({
      collection: 'users',
      where: { roles: { contains: 'collector' } },
      sort: 'name',
    })
    collectors = res.docs
  }

  // Fetch court agents for claims officer
  let courtAgents: any[] = []
  if (isClaimsOfficer) {
    const res = await payload.find({
      collection: 'users',
      where: { roles: { contains: 'court-agent' } },
      sort: 'name',
    })
    courtAgents = res.docs
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Accounts</h1>
      <FilterableAccountsTable
        baseFilter={baseFilter}
        showAssignment={isManagement || isClaimsOfficer}
        collectors={collectors}
        courtAgents={courtAgents}
        assignmentType={isClaimsOfficer ? 'court-agent' : 'collector'}
      />
    </div>
  )
}
