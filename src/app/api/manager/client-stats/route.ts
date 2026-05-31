import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const payload = await getPayload()

  // All accounts for this client - ADD limit: 9999
  const accounts = await payload.find({
    collection: 'accounts',
    where: { client: { equals: clientId } },
    limit: 9999,
  })
  const accountIds = accounts.docs.map((a) => a.id)

  // Calculate totals from stored fields
  let totalCollectable = 0
  let totalOutstanding = 0
  let totalCollected = 0

  for (const account of accounts.docs) {
    totalCollectable += account.totalCollectable || 0
    totalOutstanding += account.currentBalance || 0
    totalCollected += account.paymentsReceived || 0
  }

  // Total collected from payments (as backup/verification)
  const payments =
    accountIds.length > 0
      ? await payload.find({
          collection: 'payments',
          where: {
            and: [{ status: { equals: 'completed' } }, { account: { in: accountIds } }],
          },
          limit: 9999,
        })
      : { docs: [] }

  const totalCollectedFromPayments = payments.docs.reduce((sum, p) => sum + (p.amount ?? 0), 0)

  // Broken promises
  const brokenCount =
    accountIds.length > 0
      ? await payload.count({
          collection: 'scheduled-payments',
          where: {
            and: [{ status: { equals: 'missed' } }, { account: { in: accountIds } }],
          },
        })
      : { totalDocs: 0 }

  // Active accounts that have at least one completed payment
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
