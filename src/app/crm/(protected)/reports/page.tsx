import { Tabs } from '@/components/crm/Tabs'
import { CollectorProductivity } from '@/components/crm/reports/CollectorProductivity'
import { ClientPortfolio } from '@/components/crm/reports/ClientPortfolio'

export default async function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <Tabs
        tabs={[
          { label: 'Collector Productivity', content: <CollectorProductivity /> },
          { label: 'Client Portfolio', content: <ClientPortfolio /> },
        ]}
      />
    </div>
  )
}
