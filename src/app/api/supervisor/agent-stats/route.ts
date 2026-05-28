import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')
  if (!agentId) return NextResponse.json({ error: 'Missing agentId' }, { status: 400 })

  const payload = await getPayload()

  // 1. All active accounts assigned to this agent
  const accounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [{ status: { equals: 'active' } }, { assignedCollector: { equals: agentId } }],
    },
    limit: 500,
  })

  const totalAccounts = accounts.totalDocs
  const totalOutstanding = accounts.docs.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0)

  // 2. Total collected (all completed payments by this agent)
  const payments = await payload.find({
    collection: 'payments',
    where: {
      and: [{ collectedBy: { equals: agentId } }, { status: { equals: 'completed' } }],
    },
  })
  const totalCollected = payments.docs.reduce((sum, p) => sum + (p.amount ?? 0), 0)

  // 3. Broken promises – missed scheduled payments for these accounts
  const accountIds = accounts.docs.map((a) => a.id)
  const brokenCount = await payload.count({
    collection: 'scheduled-payments',
    where: {
      and: [{ status: { equals: 'missed' } }, { account: { in: accountIds } }],
    },
  })

  // 4. Future promises to pay – sum of pending scheduled payments for these accounts
  const futurePayments = await payload.find({
    collection: 'scheduled-payments',
    where: {
      and: [{ status: { equals: 'pending' } }, { account: { in: accountIds } }],
    },
  })
  const futurePromisesTotal = futurePayments.docs.reduce((sum, sp) => sum + (sp.amount ?? 0), 0)

  return NextResponse.json({
    totalAccounts,
    totalOutstanding,
    totalCollected,
    brokenPromisesCount: brokenCount.totalDocs,
    futurePromisesTotal,
  })
}
