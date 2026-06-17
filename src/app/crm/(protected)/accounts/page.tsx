import { headers, cookies } from 'next/headers'
import { getPayload } from '@/payload'
import { FilterableAccountsTable } from '@/components/crm/FilterableAccountsTable'
import {
  getHighestRole,
  canViewAllAccounts,
  canAssignCollector,
  canAssignCourtAgent,
  isClient,
} from '@/lib/permissions'

export default async function AccountsPage() {
  const payload = await getPayload()
  const headersList = await headers()
  const cookieStore = await cookies()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) return <p className="text-gray-500">Unauthorized</p>

  const roles: string[] = user?.roles ?? []
  const activeRoleCookie = cookieStore.get('activeRole')?.value
  const activeRole =
    activeRoleCookie && roles.includes(activeRoleCookie) ? activeRoleCookie : getHighestRole(roles)

  const isManagement =
    ['supervisor', 'crm-manager', 'admin'].includes(activeRole) && canViewAllAccounts(activeRole)
  const isClaimsOfficer = activeRole === 'claims-officer'
  const isCourtAgent = activeRole === 'court-agent'
  const isProcessServer = activeRole === 'process-server'
  const isCollector = activeRole === 'collector'
  const isClientRole = isClient(activeRole) // check if active role is client

  // Build filter based on active role
  const baseFilter: any = {}

  if (isClientRole) {
    // Clients see only accounts linked to their own client profile
    const userDoc = await payload.findByID({ collection: 'users', id: user.id })
    const clientId =
      typeof userDoc.clientProfile === 'string'
        ? userDoc.clientProfile
        : (userDoc.clientProfile as any)?.id

    if (clientId) {
      baseFilter.client = { equals: clientId }
    } else {
      baseFilter.client = { equals: 'none' } // no accounts if not linked
    }
  } else if (isManagement) {
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

  // Collectors / court agents dropdowns – not needed for clients
  let collectors: any[] = []
  if (canAssignCollector(activeRole) && !isClientRole) {
    const res = await payload.find({
      collection: 'users',
      where: { roles: { contains: 'collector' } },
      sort: 'name',
    })
    collectors = res.docs
  }

  let courtAgents: any[] = []
  if (canAssignCourtAgent(activeRole) && !isClientRole) {
    const res = await payload.find({
      collection: 'users',
      where: { roles: { contains: 'court-agent' } },
      sort: 'name',
    })
    courtAgents = res.docs
  }

  // Clients for filter dropdown
  let clientsForFilter: any[] = []
  if (canViewAllAccounts(activeRole)) {
    const res = await payload.find({ collection: 'clients', sort: 'name', limit: 9999 })
    clientsForFilter = res.docs
  } else if (!isClientRole) {
    // For limited roles, fetch clients from their filtered accounts
    try {
      const accountsRes = await payload.find({
        collection: 'accounts',
        where: baseFilter,
        limit: 9999,
        depth: 0,
      })
      const clientIds = [...new Set(accountsRes.docs.map((a: any) => a.client).filter(Boolean))]
      if (clientIds.length > 0) {
        const res = await payload.find({
          collection: 'clients',
          where: { id: { in: clientIds } },
          sort: 'name',
        })
        clientsForFilter = res.docs
      }
    } catch (e) {
      console.error('Error fetching clients:', e)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{isClientRole ? 'My Accounts' : 'Accounts'}</h1>
      <FilterableAccountsTable
        baseFilter={baseFilter}
        showAssignment={canAssignCollector(activeRole) || canAssignCourtAgent(activeRole)}
        collectors={collectors}
        courtAgents={courtAgents}
        assignmentType={isClaimsOfficer ? 'court-agent' : 'collector'}
        filterClients={clientsForFilter}
        isClient={isClientRole} // new prop to disable edit/delete
      />
    </div>
  )
}
