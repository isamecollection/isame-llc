import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { Tabs } from '@/components/crm/Tabs'
import { CollectorProductivity } from '@/components/crm/reports/CollectorProductivity'
import ClientPortfolio from '@/components/crm/reports/ClientPortfolio'
import { ManagerClientReport } from '@/components/crm/reports/ManagerClientReport'
import { IndividualClientReport } from '@/components/crm/reports/IndividualClientReport'
import { ManagerClientPortfolioReport } from '@/components/crm/reports/ManagerClientPortfolioReport'
import { getHighestRole } from '@/lib/permissions'
import { redirect } from 'next/navigation'

export default async function ReportsPage() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) redirect('/crm/login')

  const cookieStore = await cookies()
  const roles: string[] = user.roles ?? []
  const activeRoleCookie = cookieStore.get('activeRole')?.value
  const activeRole =
    activeRoleCookie && roles.includes(activeRoleCookie) ? activeRoleCookie : getHighestRole(roles)

  const isManagement = ['admin', 'crm-manager', 'supervisor'].includes(activeRole)
  const isCollector = activeRole === 'collector'
  const isCourtAgent = activeRole === 'court-agent'
  const isClient = activeRole === 'client'

  let tabs: { label: string; content: React.ReactNode }[] = []

  if (isManagement) {
    tabs = [
      { label: 'Collector Productivity', content: <CollectorProductivity /> },
      { label: 'Company Report', content: <ManagerClientReport /> },
      { label: 'Client Report', content: <IndividualClientReport /> },
      // 🆕 Portfolio report for any client
      { label: 'Client Portfolio Report', content: <ManagerClientPortfolioReport /> },
    ]
  } else if (isCollector || isCourtAgent) {
    tabs = [{ label: 'My Performance', content: <CollectorProductivity /> }]
  } else if (isClient) {
    tabs = [{ label: 'Portfolio', content: <ClientPortfolio /> }]
  } else {
    tabs = [
      {
        label: 'Reports',
        content: (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500 dark:text-gray-400">No reports available for your role.</p>
          </div>
        ),
      },
    ]
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <Tabs tabs={tabs} />
    </div>
  )
}
