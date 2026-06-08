import { cookies, headers } from 'next/headers'
import { getPayload } from '@/payload'
import { getHighestRole } from '@/lib/permissions'
import CollectorDashboard from '@/components/crm/dashboards/CollectorDashboard'
import ManagerDashboard from '@/components/crm/dashboards/ManagerDashboard'
import AdminDashboard from '@/components/crm/dashboards/AdminDashboard'
import SupervisorDashboard from '@/components/crm/dashboards/SupervisorDashboard'
import CourtAgentDashboard from '@/components/crm/dashboards/CourtAgentDashboard'
import ProcessServerDashboard from '@/components/crm/dashboards/ProcessServerDashboard'
import ClaimsOfficerDashboard from '@/components/crm/dashboards/ClaimsOfficerDashboard'
import ClientDashboard from '@/components/crm/dashboards/ClientDashboard'

const CRM_ROLES = [
  'admin',
  'crm-manager',
  'supervisor',
  'claims-officer',
  'court-agent',
  'process-server',
  'collector',
  'client',
]

export default async function DashboardPage() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  const cookieStore = await cookies()
  const roles: string[] = user?.roles ?? []
  const crmRoles = roles.filter((r) => CRM_ROLES.includes(r))
  const hasMultipleRoles = crmRoles.length > 1

  // If multi-role user, cookie can override. Otherwise use highest priority.
  const activeRole =
    hasMultipleRoles && cookieStore.get('activeRole')?.value
      ? cookieStore.get('activeRole')?.value
      : getHighestRole(roles)

  if (activeRole === 'collector') return <CollectorDashboard />
  if (activeRole === 'crm-manager') return <ManagerDashboard />
  if (activeRole === 'admin') return <AdminDashboard />
  if (activeRole === 'supervisor') return <SupervisorDashboard />
  if (activeRole === 'court-agent') return <CourtAgentDashboard />
  if (activeRole === 'process-server') return <ProcessServerDashboard />
  if (activeRole === 'claims-officer') return <ClaimsOfficerDashboard />
  if (activeRole === 'client') return <ClientDashboard />

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Role: {activeRole}</p>
    </div>
  )
}
