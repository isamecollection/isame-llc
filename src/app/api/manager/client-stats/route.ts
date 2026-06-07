import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getHighestRole, canManageClients } from '@/lib/permissions'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  // Authenticate
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Authorize
  const roles: string[] = user.roles || []
  const effectiveRole = getHighestRole(roles)

  if (!canManageClients(effectiveRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const accounts = await payload.find({
    collection: 'accounts',
    where: { client: { equals: clientId } },
    limit: 9999,
  })
  const accountIds = accounts.docs.map((a) => a.id)

  let totalCollectable = 0
  let totalOutstanding = 0
  let totalCollected = 0

  for (const account of accounts.docs) {
    totalCollectable += account.totalCollectable || 0
    totalOutstanding += account.currentBalance || 0
    totalCollected += account.paymentsReceived || 0
  }

  const payments =
    accountIds.length > 0
      ? await payload.find({
          collection: 'payments',
          where: { and: [{ status: { equals: 'completed' } }, { account: { in: accountIds } }] },
          limit: 9999,
        })
      : { docs: [] }

  const brokenCount =
    accountIds.length > 0
      ? await payload.count({
          collection: 'scheduled-payments',
          where: { and: [{ status: { equals: 'missed' } }, { account: { in: accountIds } }] },
        })
      : { totalDocs: 0 }

  const paidAccountIds = new Set(payments.docs.map((p) => p.account as string))
  const activeWithPayments = accounts.docs.filter(
    (a) => a.status === 'active' && paidAccountIds.has(a.id),
  ).length

  return NextResponse.json({
    totalAccounts: accounts.totalDocs,
    totalCollectable,
    totalOutstanding,
    totalCollected,
    brokenCount: brokenCount.totalDocs,
    activeWithPayments,
  })
}
