import { getPayload } from '@/payload'
import ClientAccountCharts from './ClientAccountCharts'

export async function ClientAccountReport({ accountId }: { accountId: string }) {
  const payload = await getPayload()
  const account = await payload.findByID({ collection: 'accounts', id: accountId, depth: 1 })

  if (!account) return <p className="text-gray-500">Account not found.</p>

  const [agreements, payments, legalCases] = await Promise.all([
    payload.find({ collection: 'agreements', where: { account: { equals: accountId } } }),
    payload.find({
      collection: 'payments',
      where: { account: { equals: accountId } },
      sort: '-date',
    }),
    payload.find({ collection: 'legal-cases', where: { account: { equals: accountId } } }),
  ])

  const totalCollected = payments.docs.reduce((sum, p) => sum + (p.amount ?? 0), 0)
  const totalPromised = agreements.docs
    .filter((a) => a.status === 'active' || a.status === 'pending')
    .reduce((sum, a) => sum + (a.totalAmount ?? 0), 0)
  const brokenPromises = agreements.docs.filter((a) => a.status === 'breached').length

  // Chart data: daily collections last 7 days
  const today = new Date()
  const dailyData: { date: string; amount: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().split('T')[0]
    const nextDayStr = new Date(d.getTime() + 86400000).toISOString().split('T')[0]
    const dayPayments = payments.docs.filter(
      (p) => p.date && p.date >= dayStr && p.date < nextDayStr,
    )
    const amount = dayPayments.reduce((s, p) => s + (p.amount ?? 0), 0)
    dailyData.push({ date: dayStr, amount })
  }

  // Legal info
  const legalCase = legalCases.docs[0]
  const courtEvents = legalCase?.courtEvents || []
  const nextEvent = courtEvents
    .filter((ev: any) => new Date(ev.eventDate) > new Date())
    .sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())[0]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Collected</p>
          <p className="text-2xl font-bold">${totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Outstanding Balance</p>
          <p className="text-2xl font-bold">${(account.currentBalance ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Promises</p>
          <p className="text-2xl font-bold">${totalPromised.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Broken Promises</p>
          <p className="text-2xl font-bold text-red-600">{brokenPromises}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Collections (Last 7 Days)</h3>
        <div style={{ height: 300 }}>
          <ClientAccountCharts dailyData={dailyData} />
        </div>
      </div>

      {/* Legal Info */}
      {legalCase && (
        <div className="bg-white dark:bg-gray-800 border rounded-xl p-4">
          <h3 className="font-semibold mb-2">Legal Status</h3>
          <p className="text-sm">
            Status:{' '}
            <span className="font-medium capitalize">{legalCase.status?.replace('_', ' ')}</span>
          </p>
          {legalCase.court && <p className="text-sm">Court: {legalCase.court}</p>}
          {legalCase.caseNumber && <p className="text-sm">Case #: {legalCase.caseNumber}</p>}
          {nextEvent && (
            <div className="mt-2 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">
                Next Court Event
              </p>
              <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                {new Date(nextEvent.eventDate).toLocaleDateString()} – {nextEvent.eventType}
              </p>
              {nextEvent.notes && (
                <p className="text-sm text-blue-600 dark:text-blue-400">{nextEvent.notes}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="bg-white dark:bg-gray-800 border rounded-xl p-4">
        <h3 className="font-semibold mb-2">Recent Notes</h3>
        <NoteList accountId={accountId} />
      </div>
    </div>
  )
}

async function NoteList({ accountId }: { accountId: string }) {
  const payload = await getPayload()
  const notes = await payload.find({
    collection: 'notes',
    where: { account: { equals: accountId } },
    sort: '-createdAt',
    limit: 5,
  })
  if (notes.docs.length === 0) return <p className="text-gray-500">No notes yet.</p>
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {notes.docs.map((n: any) => (
        <li key={n.id} className="py-2">
          <p className="text-sm whitespace-pre-wrap">{n.content}</p>
          <p className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  )
}
