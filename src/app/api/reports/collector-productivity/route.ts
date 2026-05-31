import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start') || ''
  const end = searchParams.get('end') || ''

  const payload = await getPayload()

  // Fetch all collectors
  const collectors = await payload.find({
    collection: 'users',
    where: { roles: { contains: 'collector' } },
  })

  const results = await Promise.all(
    collectors.docs.map(async (user: any) => {
      // Build where clauses properly
      const callsWhere: any = { createdBy: { equals: user.id } }
      const notesWhere: any = { createdBy: { equals: user.id } }
      const agreementsWhere: any = { createdBy: { equals: user.id } }
      const paymentsWhere: any = {
        and: [{ collectedBy: { equals: user.id } }, { status: { equals: 'completed' } }],
      }

      // Add date filters only if start/end are provided
      if (start || end) {
        const dateFilter: any = {}
        if (start) dateFilter.greater_than_equal = start
        if (end) dateFilter.less_than_equal = end

        callsWhere.and = [{ createdAt: dateFilter }]
        notesWhere.and = [{ createdAt: dateFilter }]
        agreementsWhere.and = [{ createdAt: dateFilter }]
        paymentsWhere.and.push({ date: dateFilter })
      }

      const [calls, notes, agreements, paymentsSum, broken] = await Promise.all([
        payload.count({
          collection: 'call-attempts',
          where: callsWhere,
        }),
        payload.count({
          collection: 'notes',
          where: notesWhere,
        }),
        payload.count({
          collection: 'agreements',
          where: agreementsWhere,
        }),
        payload.find({
          collection: 'payments',
          where: paymentsWhere,
          limit: 9999,
        }),
        payload.count({
          collection: 'scheduled-payments',
          where: {
            and: [{ status: { equals: 'missed' } }, { account: { exists: true } }],
          },
        }),
      ])

      const totalCollected = paymentsSum.docs.reduce((sum, p) => sum + (p.amount ?? 0), 0)

      return {
        id: user.id,
        name: user.name,
        calls: calls.totalDocs,
        notes: notes.totalDocs,
        agreementsCreated: agreements.totalDocs,
        paymentsReceived: paymentsSum.totalDocs,
        totalCollected,
        promisesBroken: broken.totalDocs,
      }
    }),
  )

  return NextResponse.json(results)
}
