import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function POST() {
  const payload = await getPayload()

  const accounts = await payload.find({
    collection: 'accounts',
    where: {
      or: [{ summonsAmount: { greater_than: 0 } }, { courtCharge: { greater_than: 0 } }],
    },
    limit: 9999,
  })

  let updated = 0
  let skipped = 0

  for (const account of accounts.docs) {
    const summons = account.summonsAmount || 0
    const court = account.courtCharge || 0
    const totalRemoved = summons + court

    if (totalRemoved > 0) {
      const newCollectable = (account.totalCollectable || 0) - totalRemoved
      const newBalance = (account.currentBalance || 0) - totalRemoved

      await payload.update({
        collection: 'accounts',
        id: account.id,
        data: {
          summonsAmount: 0,
          courtCharge: 0,
          totalCollectable: Math.max(0, Math.round(newCollectable * 100) / 100),
          currentBalance: Math.max(0, Math.round(newBalance * 100) / 100),
        },
      })
      updated++
    } else {
      skipped++
    }
  }

  return NextResponse.json({
    message: `Migration complete. Updated: ${updated}, Skipped: ${skipped}`,
    total: accounts.totalDocs,
    updated,
    skipped,
  })
}
