import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Optional: verify cron secret
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const payload = await getPayload()
  const now = new Date()

  // 1. Find all missed pending scheduled payments
  const missedPayments = await payload.find({
    collection: 'scheduled-payments',
    where: {
      and: [{ status: { equals: 'pending' } }, { dueDate: { less_than: now.toISOString() } }],
    },
    limit: 500,
  })

  let processed = 0

  for (const sp of missedPayments.docs) {
    // Mark the scheduled payment as missed
    await payload.update({
      collection: 'scheduled-payments',
      id: sp.id,
      data: { status: 'missed' },
    })

    // If it belongs to an agreement, breach it
    if (sp.agreement) {
      const agreementId = typeof sp.agreement === 'string' ? sp.agreement : sp.agreement.id
      await payload.update({
        collection: 'agreements',
        id: agreementId,
        data: { status: 'breached' },
      })
    }

    // Log the broken promise event
    await payload.create({
      collection: 'events',
      data: {
        type: 'promise.broken',
        account: sp.account,
        data: { scheduledPaymentId: sp.id },
      },
    })

    processed++
  }

  return NextResponse.json({ processed })
}
