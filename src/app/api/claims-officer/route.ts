import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET() {
  const payload = await getPayload()

  // 1. Accounts ready for court (have suit number or court receipt, not yet assigned)
  const courtReadyAccounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [
        {
          or: [
            { suitNo: { exists: true, not_equals: '' } },
            { courtReceiptNo: { exists: true, not_equals: '' } },
          ],
        },
        {
          or: [
            { assignedCourtAgent: { exists: false } },
            { legalStatus: { equals: 'pending_review' } },
          ],
        },
      ],
    },
    sort: '-currentBalance',
    limit: 100,
    depth: 1,
  })

  // 2. Accounts with breached agreements or missed payments
  const breachedAgreements = await payload.find({
    collection: 'agreements',
    where: { status: { equals: 'breached' } },
    limit: 9999,
  })
  const breachedAccountIds = breachedAgreements.docs.map((a) => a.account as string)

  const missedPayments = await payload.find({
    collection: 'scheduled-payments',
    where: { status: { equals: 'missed' } },
    limit: 9999,
  })
  const missedPaymentAccountIds = missedPayments.docs.map((p) => p.account as string)

  const legalFlagIds = [...new Set([...breachedAccountIds, ...missedPaymentAccountIds])]

  // 3. Accounts with status 'legal' without a case
  const legalStatusAccounts = await payload.find({
    collection: 'accounts',
    where: { status: { equals: 'legal' } },
    limit: 9999,
  })
  const legalStatusIds = legalStatusAccounts.docs.map((a) => a.id)

  const existingLegalCases = await payload.find({
    collection: 'legal-cases',
    where: { account: { in: legalStatusIds } },
    limit: 9999,
  })
  const accountsWithCaseIds = existingLegalCases.docs.map((c) => c.account as string)
  const legalNoCaseIds = legalStatusIds.filter((id) => !accountsWithCaseIds.includes(id))

  // 4. High balance accounts
  const highBalanceAccounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [{ status: { equals: 'active' } }, { currentBalance: { greater_than: 1000 } }],
    },
    limit: 9999,
  })

  const allFlaggedIds = new Set([...legalFlagIds, ...legalNoCaseIds])
  const highBalanceNoPay = highBalanceAccounts.docs
    .filter((a) => !allFlaggedIds.has(a.id))
    .map((a) => a.id)

  const pendingAccountIds = [...new Set([...legalFlagIds, ...legalNoCaseIds, ...highBalanceNoPay])]

  const pendingAccounts =
    pendingAccountIds.length > 0
      ? await payload.find({
          collection: 'accounts',
          where: { id: { in: pendingAccountIds } },
          sort: '-currentBalance',
          limit: 100,
          depth: 1,
        })
      : { docs: [] }

  // 5. Active legal cases
  const activeLegalCases = await payload.find({
    collection: 'legal-cases',
    where: { status: { not_equals: 'closed' } },
    sort: '-createdAt',
    limit: 50,
    depth: 1,
  })

  // 6. Court agents
  const courtAgents = await payload.find({
    collection: 'users',
    where: { roles: { contains: 'court-agent' } },
  })

  return NextResponse.json({
    courtReadyAccounts: courtReadyAccounts.docs,
    pendingAccounts: pendingAccounts.docs,
    activeLegalCases: activeLegalCases.docs,
    courtAgents: courtAgents.docs,
  })
}
