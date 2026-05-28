import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const payload = await getPayload()

  // All accounts for this client
  const accounts = await payload.find({
    collection: 'accounts',
    where: { client: { equals: clientId } },
  })
  const accountIds = accounts.docs.map((a) => a.id)

  const totalOutstanding = accounts.docs.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0)

  // Total collected
  const payments = await payload.find({
    collection: 'payments',
    where: {
      and: [{ status: { equals: 'completed' } }, { account: { in: accountIds } }],
    },
  })
  const totalCollected = payments.docs.reduce((sum, p) => sum + (p.amount ?? 0), 0)

  // Broken promises
  const brokenCount = await payload.count({
    collection: 'scheduled-payments',
    where: {
      and: [{ status: { equals: 'missed' } }, { account: { in: accountIds } }],
    },
  })

  // Active accounts that have at least one completed payment
  const paidAccountIds = new Set(payments.docs.map((p) => p.account as string))
  const activeWithPayments = accounts.docs.filter(
    (a) => a.status === 'active' && paidAccountIds.has(a.id),
  ).length

  return NextResponse.json({
    totalAccounts: accounts.totalDocs,
    totalOutstanding,
    totalCollected,
    brokenCount: brokenCount.totalDocs,
    activeWithPayments,
  })
}
