import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { CalendarView } from '@/components/crm/CalendarView'

export default async function CalendarPage() {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) return <p className="text-gray-500">Unauthorized</p>

  const cookieStore = await cookies()
  const activeRole = cookieStore.get('activeRole')?.value || user.roles?.[0] || 'collector'

  // Get legal cases with court events
  let legalCases: any[] = []
  if (['court-agent', 'claims-officer', 'admin', 'crm-manager'].includes(activeRole)) {
    const where: any = { status: { not_equals: 'closed' } }
    if (activeRole === 'court-agent') {
      where.assignedTo = { equals: user.id }
    }
    const cases = await payload.find({
      collection: 'legal-cases',
      where,
      depth: 2,
      limit: 9999,
    })
    legalCases = cases.docs
  }

  // Get scheduled payments for collectors
  let scheduledPayments: any[] = []
  if (['collector', 'supervisor', 'admin', 'crm-manager'].includes(activeRole)) {
    const where: any = { status: { equals: 'pending' } }
    if (activeRole === 'collector') {
      // Get collector's assigned accounts
      const accounts = await payload.find({
        collection: 'accounts',
        where: { assignedCollector: { equals: user.id } },
        limit: 9999,
      })
      const accountIds = accounts.docs.map((a) => a.id)
      if (accountIds.length > 0) {
        where.account = { in: accountIds }
      }
    }
    const payments = await payload.find({
      collection: 'scheduled-payments',
      where,
      depth: 2,
      sort: 'dueDate',
      limit: 9999,
    })
    scheduledPayments = payments.docs
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Calendar</h1>
      <CalendarView
        legalCases={legalCases}
        scheduledPayments={scheduledPayments}
        activeRole={activeRole}
      />
    </div>
  )
}
