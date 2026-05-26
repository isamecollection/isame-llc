import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start') || ''
  const end = searchParams.get('end') || ''

  const payload = await getPayload()

  // Build date filter for the range
  const dateFilter: any = {}
  if (start) dateFilter.greater_than_equal = start
  if (end) dateFilter.less_than_equal = end

  // Fetch all collectors
  const collectors = await payload.find({
    collection: 'users',
    where: { roles: { contains: 'collector' } },
  })

  const results = await Promise.all(
    collectors.docs.map(async (user: any) => {
      const [calls, notes, agreements, payments, broken] = await Promise.all([
        payload.count({
          collection: 'call-attempts',
          where: {
            and: [
              { createdBy: { equals: user.id } },
              dateFilter.createdAt ? { createdAt: dateFilter } : {},
            ],
          },
        }),
        payload.count({
          collection: 'notes',
          where: {
            and: [
              { createdBy: { equals: user.id } },
              dateFilter.createdAt ? { createdAt: dateFilter } : {},
            ],
          },
        }),
        payload.count({
          collection: 'agreements',
          where: {
            and: [
              { createdBy: { equals: user.id } },
              dateFilter.createdAt ? { createdAt: dateFilter } : {},
            ],
          },
        }),
        payload.count({
          collection: 'payments',
          where: {
            and: [
              { collectedBy: { equals: user.id } },
              { status: { equals: 'completed' } },
              dateFilter.date ? { date: dateFilter } : {},
            ],
          },
        }),
        payload.count({
          collection: 'scheduled-payments',
          where: {
            and: [{ status: { equals: 'missed' } }, { updatedAt: dateFilter.updatedAt || {} }],
          },
        }),
      ])

      // For payments, we need sum, not count. Let's fix that.
      const paymentsSum = await payload.find({
        collection: 'payments',
        where: {
          and: [
            { collectedBy: { equals: user.id } },
            { status: { equals: 'completed' } },
            dateFilter.date ? { date: dateFilter } : {},
          ],
        },
      })
      const totalCollected = paymentsSum.docs.reduce((sum, p) => sum + (p.amount ?? 0), 0)

      return {
        id: user.id,
        name: user.name,
        calls: calls.totalDocs,
        notes: notes.totalDocs,
        agreementsCreated: agreements.totalDocs,
        totalCollected,
        promisesBroken: broken.totalDocs,
      }
    }),
  )

  return NextResponse.json(results)
}
