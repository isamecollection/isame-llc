import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET() {
  const payload = await getPayload()

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Get all active legal cases
  const activeCases = await payload.find({
    collection: 'legal-cases',
    where: { status: { not_equals: 'closed' } },
    depth: 2,
    limit: 9999,
  })

  const alerts: any[] = []

  for (const legalCase of activeCases.docs) {
    const courtEvents = (legalCase.courtEvents || []) as any[]

    // Get debtor name - account might be populated or just an ID
    const account = legalCase.account as any
    const debtorName = account?.debtorName || 'Unknown'

    for (const event of courtEvents) {
      const eventDate = new Date(event.eventDate)

      // Alert for events tomorrow
      if (eventDate >= now && eventDate <= tomorrow) {
        alerts.push({
          type: 'urgent',
          caseId: legalCase.id,
          debtorName,
          caseNumber: legalCase.caseNumber,
          eventDate: event.eventDate,
          eventTime: event.eventTime || null,
          eventType: event.eventType,
          court: legalCase.court,
          message: `URGENT: Court ${event.eventType} tomorrow for ${debtorName}`,
        })
      }
      // Alert for events in the next week
      else if (eventDate > tomorrow && eventDate <= nextWeek) {
        alerts.push({
          type: 'upcoming',
          caseId: legalCase.id,
          debtorName,
          caseNumber: legalCase.caseNumber,
          eventDate: event.eventDate,
          eventTime: event.eventTime || null,
          eventType: event.eventType,
          court: legalCase.court,
          message: `Upcoming: Court ${event.eventType} on ${eventDate.toLocaleDateString()} for ${debtorName}`,
        })
      }
    }
  }

  return NextResponse.json({ alerts })
}
