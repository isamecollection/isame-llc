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
      })

      const accountIds = accounts.docs.map((a) => a.id)

      const [payments, agreements, legalCases] = await Promise.all([
        payload.find({
          collection: 'payments',
          where: {
            and: [{ status: { equals: 'completed' } }, { account: { in: accountIds } }],
          },
        }),
        payload.find({
          collection: 'agreements',
          where: {
            and: [{ account: { in: accountIds } }, { status: { equals: 'active' } }],
          },
        }),
        payload.find({
          collection: 'legal-cases',
          where: {
            and: [{ account: { in: accountIds } }, { status: { not_equals: 'closed' } }],
          },
        }),
      ])

      const totalOutstanding = accounts.docs.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0)
      const totalCollected = payments.docs.reduce((sum, p) => sum + (p.amount ?? 0), 0)

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
