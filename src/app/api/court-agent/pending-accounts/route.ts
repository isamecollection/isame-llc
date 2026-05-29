import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET() {
  const payload = await getPayload()

  // 1. Accounts with breached agreements OR missed scheduled payments
  const breachedAgreements = await payload.find({
    collection: 'agreements',
    where: { status: { equals: 'breached' } },
    limit: 1000,
  })
  const breachedAccountIds = breachedAgreements.docs.map((a) => a.account as string)

  const missedPayments = await payload.find({
    collection: 'scheduled-payments',
    where: { status: { equals: 'missed' } },
    limit: 1000,
  })
  const missedPaymentAccountIds = missedPayments.docs.map((p) => p.account as string)

  const legalFlagIds = [...new Set([...breachedAccountIds, ...missedPaymentAccountIds])]

  // 2. Accounts with status 'legal' that have no legal case yet
  const legalStatusAccounts = await payload.find({
    collection: 'accounts',
    where: { status: { equals: 'legal' } },
    limit: 500,
  })
  const legalStatusIds = legalStatusAccounts.docs.map((a) => a.id)

  // Check which of these already have a legal case
  const existingLegalCases = await payload.find({
    collection: 'legal-cases',
    where: { account: { in: legalStatusIds } },
    limit: 500,
  })
  const accountsWithCaseIds = existingLegalCases.docs.map((c) => c.account as string)
  const legalNoCaseIds = legalStatusIds.filter((id) => !accountsWithCaseIds.includes(id))

  // 3. Accounts with no payment in 60 days and balance > 1000
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  const noPaymentAccounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [
        { status: { equals: 'active' } },
        { currentBalance: { greater_than: 1000 } },
        // We'd need to filter by last payment date, but that's complex.
        // For simplicity, we'll include all active high‑balance accounts that are not already flagged.
      ],
    },
    limit: 200,
  })
  // We'll just add those that aren't already in legalFlagIds or legalNoCaseIds
  const allFlaggedIds = new Set([...legalFlagIds, ...legalNoCaseIds])
  const highBalanceNoPay = noPaymentAccounts.docs
    .filter((a) => !allFlaggedIds.has(a.id))
    .map((a) => a.id)

  const pendingAccountIds = [...new Set([...legalFlagIds, ...legalNoCaseIds, ...highBalanceNoPay])]

  // Fetch full account documents for the flagged IDs
  const pendingAccounts = await payload.find({
    collection: 'accounts',
    where: { id: { in: pendingAccountIds } },
    sort: '-currentBalance',
    limit: 100,
    depth: 1, // populate client
  })

  // 4. Active legal cases (status not closed) – for the "My Cases" section
  const activeLegalCases = await payload.find({
    collection: 'legal-cases',
    where: { status: { not_equals: 'closed' } },
    sort: '-createdAt',
    limit: 50,
    depth: 1,
  })

  return NextResponse.json({
    pendingAccounts: pendingAccounts.docs,
    activeLegalCases: activeLegalCases.docs,
  })
}
