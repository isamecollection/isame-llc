import { getPayload } from '@/payload'

export async function LegalCaseView({ accountId }: { accountId: string }) {
  const payload = await getPayload()
  const cases = await payload.find({
    collection: 'legal-cases',
    where: { account: { equals: accountId } },
  })

  if (cases.docs.length === 0) return <p>No legal case yet.</p>

  const legalCase = cases.docs[0]

  return (
    <div>
      <h4>Legal Case</h4>
      <p>
        Status: <strong>{legalCase.status}</strong>
      </p>
      <p>Case #: {legalCase.caseNumber || 'N/A'}</p>
      <p>Court: {legalCase.court || 'N/A'}</p>
      <p>Attorney: {legalCase.attorney ? 'Assigned' : 'Unassigned'}</p>
      <p>
        Filed:{' '}
        {legalCase.filedDate ? new Date(legalCase.filedDate).toLocaleDateString() : 'Not yet'}
      </p>

      {legalCase.judgment?.amount && legalCase.judgment.date && (
        <p>
          Judgment: ${legalCase.judgment.amount} on{' '}
          {new Date(legalCase.judgment.date).toLocaleDateString()}
        </p>
      )}

      <h5>Court Events</h5>
      {legalCase.courtEvents?.length ? (
        <ul>
          {legalCase.courtEvents.map((event: any, idx: number) => (
            <li key={idx}>
              {new Date(event.eventDate).toLocaleDateString()} – {event.eventType}
              {event.notes && ` — ${event.notes}`}
              {event.outcome && ` [Outcome: ${event.outcome}]`}
            </li>
          ))}
        </ul>
      ) : (
        <p>No events scheduled.</p>
      )}
    </div>
  )
}
