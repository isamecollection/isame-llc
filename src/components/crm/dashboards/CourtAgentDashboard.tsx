import { getPayload } from '@/payload'
import Link from 'next/link'

async function getCourtAgentData() {
  const payload = await getPayload()

  // Active legal cases (status not closed), with populated account and client
  const activeCases = await payload.find({
    collection: 'legal-cases',
    where: { status: { not_equals: 'closed' } },
    sort: '-createdAt',
    limit: 50,
    depth: 2, // populate account → client
  })

  return { activeCases: activeCases.docs }
}

export default async function CourtAgentDashboard() {
  const { activeCases } = await getCourtAgentData()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Court Agent Dashboard</h1>

      {activeCases.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No active legal cases.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeCases.map((c: any) => {
            // Find the next upcoming court event
            const now = new Date()
            const upcomingEvents = (c.courtEvents || [])
              .filter((ev: any) => new Date(ev.eventDate) > now)
              .sort(
                (a: any, b: any) =>
                  new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
              )
            const nextEvent = upcomingEvents[0] || null

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Top row: debtor name + status badge */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {c.account?.debtorName || 'Unknown Debtor'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {c.account?.accountNumber}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      c.status === 'new' || c.status === 'filed'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : c.status === 'judgment'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {c.status?.replace('_', ' ')}
                  </span>
                </div>

                {/* Case details */}
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                  {c.caseNumber && (
                    <p>
                      <span className="font-medium">Case #:</span> {c.caseNumber}
                    </p>
                  )}
                  {c.court && (
                    <p>
                      <span className="font-medium">Court:</span> {c.court}
                    </p>
                  )}
                  {c.filedDate && (
                    <p>
                      <span className="font-medium">Filed:</span>{' '}
                      {new Date(c.filedDate).toLocaleDateString()}
                    </p>
                  )}
                  {c.account?.client && (
                    <p>
                      <span className="font-medium">Client:</span>{' '}
                      {(c.account.client as any)?.name || '—'}
                    </p>
                  )}
                </div>

                {/* Next court event – prominent card */}
                {nextEvent ? (
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300 mb-1">
                      Next Event
                    </p>
                    <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                      {new Date(nextEvent.eventDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 capitalize">
                      {nextEvent.eventType}
                    </p>
                    {nextEvent.notes && (
                      <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 italic">
                        {nextEvent.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      No upcoming events scheduled
                    </p>
                  </div>
                )}

                {/* Action link */}
                <Link
                  href={`/crm/accounts/${c.account?.id}`}
                  className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  View Account →
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
