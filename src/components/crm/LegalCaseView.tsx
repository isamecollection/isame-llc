import { getPayload } from '@/payload'

export async function LegalCaseView({ accountId }: { accountId: string }) {
  const payload = await getPayload()
  const cases = await payload.find({
    collection: 'legal-cases',
    where: { account: { equals: accountId } },
    depth: 2,
  })

  if (cases.docs.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No legal case yet.</p>
  }

  const c = cases.docs[0]
  const now = new Date()
  const upcomingEvents = (c.courtEvents || [])
    .filter((ev: any) => new Date(ev.eventDate) > now)
    .sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Legal Case</h3>
        <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
          {c.status?.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {c.caseNumber && (
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-300">Case #:</span>{' '}
            {c.caseNumber}
          </p>
        )}
        {c.court && (
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-300">Court:</span> {c.court}
          </p>
        )}
        {c.filedDate && (
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-300">Filed:</span>{' '}
            {new Date(c.filedDate).toLocaleDateString()}
          </p>
        )}
        {c.assignedTo && (
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-300">Assigned Agent:</span>{' '}
            {(c.assignedTo as any)?.name || c.assignedTo}
          </p>
        )}
        {c.judgment?.amount && c.judgment.date && (
          <p>
            <span className="font-medium text-gray-700 dark:text-gray-300">Judgment:</span> $
            {c.judgment.amount.toLocaleString()} on {new Date(c.judgment.date).toLocaleDateString()}
          </p>
        )}
      </div>

      {upcomingEvents.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300 mb-1">
            Next Event
          </p>
          <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
            {new Date(upcomingEvents[0].eventDate).toLocaleDateString()}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400 capitalize">
            {upcomingEvents[0].eventType}
          </p>
          {upcomingEvents[0].notes && (
            <p className="text-xs text-blue-500 dark:text-blue-400 italic mt-1">
              {upcomingEvents[0].notes}
            </p>
          )}
        </div>
      )}

      {c.notes && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Internal Notes</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{c.notes}</p>
        </div>
      )}
    </div>
  )
}
