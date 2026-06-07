import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getHighestRole, canViewReports } from '@/lib/permissions'

export async function GET() {
  // Authenticate
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Authorize
  const roles: string[] = user.roles || []
  const effectiveRole = getHighestRole(roles)

  if (!canViewReports(effectiveRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const clients = await payload.find({ collection: 'clients', sort: 'name' })

  const results = await Promise.all(
    clients.docs.map(async (client: any) => {
      const accounts = await payload.find({
        collection: 'accounts',
        where: { client: { equals: client.id } },
        limit: 9999,
      })

      const accountIds = accounts.docs.map((a) => a.id)

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
          where: { and: [{ status: { equals: 'completed' } }, { account: { in: accountIds } }] },
          limit: 9999,
        }),
        payload.find({
          collection: 'agreements',
          where: { and: [{ account: { in: accountIds } }, { status: { equals: 'active' } }] },
          limit: 9999,
        }),
        payload.find({
          collection: 'legal-cases',
          where: { and: [{ account: { in: accountIds } }, { status: { not_equals: 'closed' } }] },
          limit: 9999,
        }),
      ])

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
