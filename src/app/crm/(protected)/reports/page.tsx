import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { Tabs } from '@/components/crm/Tabs'
import { CollectorProductivity } from '@/components/crm/reports/CollectorProductivity'
import ClientPortfolio from '@/components/crm/reports/ClientPortfolio'
import { ManagerClientReport } from '@/components/crm/reports/ManagerClientReport'
import { IndividualClientReport } from '@/components/crm/reports/IndividualClientReport'
import { ManagerClientPortfolioReport } from '@/components/crm/reports/ManagerClientPortfolioReport'
import { getActiveRole } from '@/lib/getActiveRole'
import { redirect } from 'next/navigation'

export default async function ReportsPage() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) redirect('/crm/login')

  // Use the shared helper that reads x-active-role cookie
  const activeRole = await getActiveRole(user)

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

      {isManagement && (
        <div className="mb-6 bg-linear-to-r  from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-semibold text-blue-900 dark:text-blue-200">
                📊 Collector Collections Report
              </h2>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Per-collector breakdown with ISAME/client share split. PDF (one page per collector)
                + CSV export.
              </p>
            </div>
            <a
              href="/crm/reports/collector-collections"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
            >
              Open Report →
            </a>
          </div>
        </div>
      )}

      <Tabs tabs={tabs} />
    </div>
  )
}
