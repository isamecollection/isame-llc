import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET() {
  const payload = await getPayload()
  const clients = await payload.find({ collection: 'clients', sort: 'name' })
  const rows: any[] = []

  for (const client of clients.docs) {
    // ADD limit: 9999 to get ALL accounts
    const accounts = await payload.find({
      collection: 'accounts',
      where: { client: { equals: client.id } },
      limit: 9999, // ← THIS IS THE FIX!
    })

    let totalCollectable = 0
    let totalCollected = 0
    let totalOutstanding = 0
    let totalIsameCharge = 0

    for (const account of accounts.docs) {
      const collectable = account.totalCollectable || 0
      const collected = account.paymentsReceived || 0
      const outstanding = account.currentBalance || 0
      const fee = account.fee20Percent || 0

      totalCollectable += collectable
      totalCollected += collected
      totalOutstanding += outstanding
      totalIsameCharge += fee
    }

    const originalName = client.name || 'Unknown'
    let anonymized = ''
    if (originalName.length > 1) {
      anonymized = originalName.charAt(0) + 'xxx' + originalName.charAt(originalName.length - 1)
    } else {
      anonymized = originalName + 'xxx'
    }

    rows.push({
      client: anonymized,
      accounts: accounts.totalDocs,
      totalCollectable: `$${totalCollectable.toLocaleString()}`,
      collected: `$${totalCollected.toLocaleString()}`,
      outstanding: `$${totalOutstanding.toLocaleString()}`,
      charge: `$${totalIsameCharge.toLocaleString()}`,
    })
  }

  return NextResponse.json({ rows })
}
