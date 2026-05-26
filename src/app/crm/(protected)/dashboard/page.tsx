import { cookies } from 'next/headers'
import CollectorDashboard from '@/components/crm/dashboards/CollectorDashboard'
import ManagerDashboard from '@/components/crm/dashboards/ManagerDashboard'
import AdminDashboard from '@/components/crm/dashboards/AdminDashboard'
import SupervisorDashboard from '@/components/crm/dashboards/SupervisorDashboard'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const activeRole = cookieStore.get('activeRole')?.value || 'collector'

  if (activeRole === 'collector') return <CollectorDashboard />
  if (activeRole === 'crm-manager') return <ManagerDashboard />
  if (activeRole === 'admin') return <AdminDashboard />
  if (activeRole === 'supervisor') return <SupervisorDashboard />
  // Fallback for any other role (editor, etc.)
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Role: {activeRole}</p>
    </div>
  )
}
