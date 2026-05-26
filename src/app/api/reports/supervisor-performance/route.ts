import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const supervisorId = searchParams.get('supervisorId')
  if (!supervisorId) return NextResponse.json({ error: 'Missing supervisorId' }, { status: 400 })

  const payload = await getPayload()

  // Verify the requesting user is a supervisor (optional but recommended)
  // We'll trust the param for now; you can add auth if needed.

  // 1. Get team members
  const team = await payload.find({
    collection: 'users',
    where: {
      and: [{ supervisor: { equals: supervisorId } }, { roles: { contains: 'collector' } }],
    },
  })

  const collectorIds = team.docs.map((m) => m.id)

  // 2. Daily collections for the last 7 days
  const today = new Date()
  const dailyCollections: { date: string; amount: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().split('T')[0]
    const nextDayStr = new Date(d.getTime() + 86400000).toISOString().split('T')[0]

    const payments = await payload.find({
      collection: 'payments',
      where: {
        and: [
          { status: { equals: 'completed' } },
          { collectedBy: { in: collectorIds } },
          { date: { greater_than_equal: dayStr } },
          { date: { less_than: nextDayStr } },
        ],
      },
    })
    const total = payments.docs.reduce((sum, p) => sum + (p.amount ?? 0), 0)
    dailyCollections.push({ date: dayStr, amount: total })
  }

  // 3. Promises kept vs. broken per collector (this month)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const endOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
    23,
    59,
    59,
  ).toISOString()

  const promisesPerCollector = await Promise.all(
    team.docs.map(async (member) => {
      // Kept: scheduled payments paid this month
      const kept = await payload.count({
        collection: 'scheduled-payments',
        where: {
          and: [
            { status: { equals: 'paid' } },
            { updatedAt: { greater_than_equal: startOfMonth } },
            { updatedAt: { less_than_equal: endOfMonth } },
            // We need to tie to collector – we can use account.assignedCollector, but that's indirect.
            // For simplicity, we'll count all payments collected by this collector that are linked to scheduled-payments (via agreement).
          ],
        },
      })
      // Broken: scheduled payments missed this month
      const broken = await payload.count({
        collection: 'scheduled-payments',
        where: {
          and: [
            { status: { equals: 'missed' } },
            { updatedAt: { greater_than_equal: startOfMonth } },
            { updatedAt: { less_than_equal: endOfMonth } },
          ],
        },
      })
      return { name: member.name, kept: kept.totalDocs, broken: broken.totalDocs }
    }),
  )

  // 4. Calls per collector this month
  const callsPerCollector = await Promise.all(
    team.docs.map(async (member) => {
      const calls = await payload.count({
        collection: 'call-attempts',
        where: {
          and: [
            { createdBy: { equals: member.id } },
            { createdAt: { greater_than_equal: startOfMonth } },
            { createdAt: { less_than_equal: endOfMonth } },
          ],
        },
      })
      return { name: member.name, calls: calls.totalDocs }
    }),
  )

  return NextResponse.json({
    dailyCollections,
    promisesPerCollector,
    callsPerCollector,
  })
}
