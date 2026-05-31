import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET() {
  const payload = await getPayload()

  const clients = await payload.find({ collection: 'clients', sort: 'name' })

  const results = await Promise.all(
    clients.docs.map(async (client: any) => {
      const accounts = await payload.find({
        collection: 'accounts',
        where: { client: { equals: client.id } },
        limit: 9999, // ← ADD THIS
      })

      const accountIds = accounts.docs.map((a) => a.id)

      // Only run these queries if there are accounts
      if (accountIds.length === 0) {
        return {
          id: client.id,
          name: client.name,
          prefix: client.prefix,
          totalOutstanding: 0,
          totalCollected: 0,
          accountCount: 0,
          activeAgreements: 0,
          legalCases: 0,
        }
      }

      const [payments, agreements, legalCases] = await Promise.all([
        payload.find({
          collection: 'payments',
          where: {
            and: [{ status: { equals: 'completed' } }, { account: { in: accountIds } }],
          },
          limit: 9999, // ← ADD THIS
        }),
        payload.find({
          collection: 'agreements',
          where: {
            and: [{ account: { in: accountIds } }, { status: { equals: 'active' } }],
          },
          limit: 9999, // ← ADD THIS
        }),
        payload.find({
          collection: 'legal-cases',
          where: {
            and: [{ account: { in: accountIds } }, { status: { not_equals: 'closed' } }],
          },
          limit: 9999, // ← ADD THIS
        }),
      ])

      // Calculate totals using stored fields
      let totalOutstanding = 0
      let totalCollected = 0

      for (const account of accounts.docs) {
        totalOutstanding += account.currentBalance || 0
        totalCollected += account.paymentsReceived || 0
      }

      return {
        id: client.id,
        name: client.name,
        prefix: client.prefix,
        totalOutstanding,
        totalCollected,
        accountCount: accounts.totalDocs,
        activeAgreements: agreements.totalDocs,
        legalCases: legalCases.totalDocs,
      }
    }),
  )

  return NextResponse.json(results)
}
