import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function POST() {
  const payload = await getPayload()

  const accounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [{ status: { equals: 'paid' } }, { currentBalance: { greater_than: 0 } }],
    },
    limit: 9999,
  })

  let fixed = 0
  let skipped = 0

  for (const account of accounts.docs) {
    const balance = account.currentBalance || 0
    const paid = account.paymentsReceived || 0
    const total = account.totalCollectable || 0

    let newStatus: 'active' | 'settled' | 'paid' = 'active'
    if (paid >= total && total > 0) {
      newStatus = 'settled'
    } else if (balance <= 0) {
      newStatus = 'paid'
    }

    if (newStatus !== account.status) {
      await payload.update({
        collection: 'accounts',
        id: account.id,
        data: { status: newStatus },
      })
      fixed++
    } else {
      skipped++
    }
  }

  return NextResponse.json({
    message: `Migration complete. Fixed: ${fixed}, Skipped: ${skipped}`,
    total: accounts.totalDocs,
    fixed,
    skipped,
  })
}
