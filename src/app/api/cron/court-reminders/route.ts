import { getPayload } from '@/payload'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Protect with cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload()
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const activeCases = await payload.find({
    collection: 'legal-cases',
    where: { status: { not_equals: 'closed' } },
    depth: 2,
    limit: 9999,
  })

  let remindersSent = 0
  const reminders: any[] = []

  for (const legalCase of activeCases.docs) {
    const courtEvents = (legalCase.courtEvents || []) as any[]
    const account = legalCase.account as any
    const courtAgent = legalCase.assignedTo as any
    const collector = account?.assignedCollector as any

    for (const event of courtEvents) {
      const eventDate = new Date(event.eventDate)
      const debtorName = account?.debtorName || 'Unknown'

      // Urgent: Tomorrow's hearings
      if (eventDate >= now && eventDate <= tomorrow) {
        const recipients = [courtAgent?.email, collector?.email].filter(Boolean)

        for (const email of recipients) {
          if (!email) continue

          await payload.sendEmail({
            to: email,
            subject: `⚠️ URGENT: Court Tomorrow - ${debtorName}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:2px solid #dc2626;border-radius:8px;">
                <h2 style="color:#dc2626;">⚠️ Court Hearing Tomorrow</h2>
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Debtor:</strong></td><td>${debtorName}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Case #:</strong></td><td>${legalCase.caseNumber || 'N/A'}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Court:</strong></td><td>${legalCase.court || 'N/A'}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Date:</strong></td><td>${eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Time:</strong></td><td>${event.eventTime || 'TBD'}</td></tr>
                  <tr><td style="padding:8px;"><strong>Type:</strong></td><td style="text-transform:capitalize;">${event.eventType}</td></tr>
                </table>
                <p style="margin-top:20px;color:#666;font-size:12px;">Automated reminder from Isame CRM.</p>
              </div>
            `,
          })
          remindersSent++
        }

        reminders.push({
          debtor: debtorName,
          courtDate: eventDate.toISOString(),
          recipients: recipients.length,
        })
      }

      // Upcoming: Next week's hearings
      else if (eventDate > tomorrow && eventDate <= nextWeek) {
        const recipients = [courtAgent?.email, collector?.email].filter(Boolean)

        for (const email of recipients) {
          if (!email) continue

          await payload.sendEmail({
            to: email,
            subject: `📅 Upcoming Court: ${debtorName} - ${eventDate.toLocaleDateString()}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:2px solid #2563eb;border-radius:8px;">
                <h2 style="color:#2563eb;">📅 Upcoming Court Hearing</h2>
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Debtor:</strong></td><td>${debtorName}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Case #:</strong></td><td>${legalCase.caseNumber || 'N/A'}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #eee;"><strong>Date:</strong></td><td>${eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                  <tr><td style="padding:8px;"><strong>Time:</strong></td><td>${event.eventTime || 'TBD'}</td></tr>
                </table>
                <p style="margin-top:20px;color:#666;font-size:12px;">Automated reminder from Isame CRM.</p>
              </div>
            `,
          })
          remindersSent++
        }

        reminders.push({
          debtor: debtorName,
          courtDate: eventDate.toISOString(),
          recipients: recipients.length,
        })
      }
    }
  }

  return NextResponse.json({
    message: `Sent ${remindersSent} court reminders`,
    remindersSent,
    reminders,
  })
}
