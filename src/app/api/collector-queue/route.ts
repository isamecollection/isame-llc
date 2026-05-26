import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const collectorId = searchParams.get('collectorId')
  if (!collectorId) return NextResponse.json({ error: 'Missing collectorId' }, { status: 400 })

  const payload = await getPayload()

  // 1. All assigned active accounts
  const allAccounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [{ status: { equals: 'active' } }, { assignedCollector: { equals: collectorId } }],
    },
    sort: '-currentBalance',
    limit: 200,
  })

  const accounts = allAccounts.docs

  // 2. Find accounts with breached agreements or missed scheduled payments
  // Fetch all agreements for these accounts
  const accountIds = accounts.map((a) => a.id)
  const breachedAgreements = await payload.find({
    collection: 'agreements',
    where: {
      and: [{ account: { in: accountIds } }, { status: { equals: 'breached' } }],
    },
    limit: 1000,
  })
  const breachedAccountIds = breachedAgreements.docs.map((a) => a.account as string)

  // Also find accounts with any missed scheduled payments (even if agreement not breached)
  const missedPayments = await payload.find({
    collection: 'scheduled-payments',
    where: {
      and: [{ account: { in: accountIds } }, { status: { equals: 'missed' } }],
    },
    limit: 1000,
  })
  const missedPaymentAccountIds = missedPayments.docs.map((p) => p.account as string)

  // Combine broken promise accounts
  const brokenAccountIds = [...new Set([...breachedAccountIds, ...missedPaymentAccountIds])]

  // 3. No recent contact: lastContactedAt older than 30 days or never
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const noContactAccounts = accounts
    .filter((a) => {
      if (!a.lastContactedAt) return true
      return new Date(a.lastContactedAt) < thirtyDaysAgo
    })
    .filter((a) => !brokenAccountIds.includes(a.id))

  // 4. High balance: > $5,000 and not in the above categories
  const highBalanceAccounts = accounts
    .filter((a) => {
      return (a.currentBalance ?? 0) > 5000
    })
    .filter(
      (a) => !brokenAccountIds.includes(a.id) && !noContactAccounts.some((n) => n.id === a.id),
    )

  // 5. The rest
  const otherAccounts = accounts.filter(
    (a) =>
      !brokenAccountIds.includes(a.id) &&
      !noContactAccounts.some((n) => n.id === a.id) &&
      !highBalanceAccounts.some((h) => h.id === a.id),
  )

  return NextResponse.json({
    broken: accounts.filter((a) => brokenAccountIds.includes(a.id)),
    noContact: noContactAccounts,
    highBalance: highBalanceAccounts,
    other: otherAccounts,
  })
}
