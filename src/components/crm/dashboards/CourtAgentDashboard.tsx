import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import Link from 'next/link'
import { CourtAgentActions } from '@/components/crm/CourtAgentActions'
import { EmptyState } from '@/components/crm/EmptyState'

async function getCourtAgentData() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
  if (!user) return null

  const activeCases = await payload.find({
    collection: 'legal-cases',
    where: {
      and: [{ assignedTo: { equals: user.id } }, { status: { not_equals: 'closed' } }],
    },
    sort: '-createdAt',
    limit: 50,
    depth: 2,
  })

  const assignedAccounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [
        { assignedCourtAgent: { equals: user.id } },
        { legalStatus: { in: ['assigned', 'in_court'] } },
      ],
    },
    sort: '-currentBalance',
    depth: 1,
  })

  const processServers = await payload.find({
    collection: 'users',
    where: { roles: { contains: 'process-server' } },
  })

  return {
    activeCases: activeCases.docs,
    assignedAccounts: assignedAccounts.docs,
    processServers: processServers.docs,
    user,
  }
}

export default async function CourtAgentDashboard() {
  const data = await getCourtAgentData()
  if (!data) return <p className="text-gray-500">Not authorized</p>

  const { activeCases, assignedAccounts, processServers } = data

  // Full empty state
  if (assignedAccounts.length === 0 && activeCases.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Court Agent Dashboard</h1>
        <EmptyState
          icon="⚖️"
          title="No cases assigned yet"
          description="Accounts and legal cases will appear here once a Claims Officer assigns them to you."
        />
      </div>
    )
  }

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const upcomingHearings: any[] = []
  const urgentHearings: any[] = []

  for (const c of activeCases) {
    const events = (c.courtEvents || [])
      .filter((ev: any) => new Date(ev.eventDate) > now)
      .sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    if (events.length > 0) {
      const nextEvent = events[0]
      const eventDate = new Date(nextEvent.eventDate)
      if (eventDate <= tomorrow) {
        urgentHearings.push({ ...c, nextEvent })
      } else if (eventDate <= nextWeek) {
        upcomingHearings.push({ ...c, nextEvent })
      }
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Court Agent Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Assigned Accounts" value={assignedAccounts.length} />
        <StatCard title="Active Cases" value={activeCases.length} />
        <StatCard title="Urgent (Today/Tomorrow)" value={urgentHearings.length} urgent />
        <StatCard title="This Week" value={upcomingHearings.length} warning />
      </div>

      {/* Urgent Hearings */}
      {urgentHearings.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-300 mb-3">
            🔴 Urgent Court Dates
          </h2>
          <div className="space-y-2">
            {urgentHearings.map((c: any) => {
              const daysUntil = Math.ceil(
                (new Date(c.nextEvent.eventDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              )
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-100 dark:border-red-800"
                >
                  <div>
                    <p className="font-semibold">{c.account?.debtorName || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">
                      {c.caseNumber && <span>Case #{c.caseNumber} • </span>}
                      {new Date(c.nextEvent.eventDate).toLocaleDateString()}
                      {c.nextEvent.eventTime && ` at ${c.nextEvent.eventTime}`}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {c.nextEvent.eventType} • {c.court || 'No court specified'}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-full text-xs font-bold">
                    {daysUntil === 0
                      ? 'TODAY!'
                      : daysUntil === 1
                        ? 'TOMORROW'
                        : `${daysUntil} days`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming This Week */}
      {upcomingHearings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-bold text-yellow-700 dark:text-yellow-300 mb-3">
            🟡 Upcoming This Week
          </h2>
          <div className="space-y-2">
            {upcomingHearings.map((c: any) => {
              const daysUntil = Math.ceil(
                (new Date(c.nextEvent.eventDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              )
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3"
                >
                  <div>
                    <p className="font-semibold">{c.account?.debtorName || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">
                      {c.caseNumber && <span>Case #{c.caseNumber} • </span>}
                      {new Date(c.nextEvent.eventDate).toLocaleDateString()}
                      {c.nextEvent.eventTime && ` at ${c.nextEvent.eventTime}`}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {c.nextEvent.eventType} • {c.court || 'No court specified'}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
                    {daysUntil} days
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Assigned Accounts */}
      <h2 className="text-xl font-semibold mb-3">📋 Assigned Accounts</h2>
      {assignedAccounts.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No accounts assigned yet"
          description="Accounts will appear here once a Claims Officer assigns them to you."
        />
      ) : (
        <div className="space-y-4 mb-8">
          {assignedAccounts.map((account: any) => (
            <div
              key={account.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                      {account.debtorName || 'Unknown'}
                    </h3>
                    <span className="text-xs text-gray-500">#{account.accountNumber}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${account.legalStatus === 'in_court' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}
                    >
                      {account.legalStatus?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div>
                      <span className="font-medium">Balance:</span> $
                      {account.currentBalance?.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Total:</span> $
                      {account.totalCollectable?.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Paid:</span> $
                      {account.paymentsReceived?.toLocaleString()}
                    </div>
                    {account.suitNo && (
                      <div>
                        <span className="font-medium">Suit No:</span> {account.suitNo}
                      </div>
                    )}
                    {account.courtReceiptNo && (
                      <div>
                        <span className="font-medium">Receipt:</span> {account.courtReceiptNo}
                      </div>
                    )}
                    {account.assignedProcessServer && (
                      <div>
                        <span className="font-medium">Server:</span>{' '}
                        {typeof account.assignedProcessServer === 'object'
                          ? account.assignedProcessServer.name
                          : 'Assigned'}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">📍</span>{' '}
                    {[account.street, account.townCity, account.district]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-62.5">
                  <CourtAgentActions accountId={account.id} processServers={processServers} />
                  <Link
                    href={`/crm/accounts/${account.id}`}
                    className="text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Full Account →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Legal Cases Grid */}
      <h2 className="text-xl font-semibold mb-3">⚖️ Active Legal Cases</h2>
      {activeCases.length === 0 ? (
        <EmptyState
          icon="⚖️"
          title="No active legal cases"
          description="Legal cases will appear here once they are filed."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeCases.map((c: any) => {
            const upcomingEvents = (c.courtEvents || [])
              .filter((ev: any) => new Date(ev.eventDate) > now)
              .sort(
                (a: any, b: any) =>
                  new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
              )
            const nextEvent = upcomingEvents[0] || null
            const daysUntil = nextEvent
              ? Math.ceil(
                  (new Date(nextEvent.eventDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                )
              : null
            return (
              <div
                key={c.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
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
                    className={`text-xs px-2 py-1 rounded-full font-medium ${c.status === 'new' || c.status === 'filed' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : c.status === 'served' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : c.status === 'judgment' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    {c.status?.replace('_', ' ')}
                  </span>
                </div>
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
                </div>
                {nextEvent ? (
                  <div
                    className={`rounded-lg p-3 mb-3 ${daysUntil !== null && daysUntil <= 1 ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800' : daysUntil !== null && daysUntil <= 3 ? 'bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800' : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'}`}
                  >
                    <p className="text-xs font-semibold uppercase mb-1">
                      {daysUntil !== null && daysUntil <= 1
                        ? '🔴 Next Event'
                        : daysUntil !== null && daysUntil <= 3
                          ? '🟠 Next Event'
                          : '📅 Next Event'}
                    </p>
                    <p className="text-lg font-bold">
                      {new Date(nextEvent.eventDate).toLocaleDateString()}
                      {nextEvent.eventTime && (
                        <span className="text-sm font-normal"> at {nextEvent.eventTime}</span>
                      )}
                    </p>
                    <p className="text-sm capitalize">{nextEvent.eventType}</p>
                    {daysUntil !== null && (
                      <p className="text-xs mt-1 font-medium">
                        {daysUntil === 0
                          ? 'Today!'
                          : daysUntil === 1
                            ? 'Tomorrow!'
                            : `${daysUntil} days away`}
                      </p>
                    )}
                    {nextEvent.notes && <p className="text-xs italic mt-1">{nextEvent.notes}</p>}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-500">No upcoming events scheduled</p>
                  </div>
                )}
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

function StatCard({
  title,
  value,
  urgent,
  warning,
}: {
  title: string
  value: number
  urgent?: boolean
  warning?: boolean
}) {
  return (
    <div
      className={`rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border ${urgent ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : warning ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
    >
      <h3
        className={`text-sm font-medium ${urgent ? 'text-red-500 dark:text-red-400' : warning ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`}
      >
        {title}
      </h3>
      <p
        className={`text-3xl font-bold mt-1 ${urgent ? 'text-red-600 dark:text-red-400' : warning ? 'text-yellow-700 dark:text-yellow-300' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}
