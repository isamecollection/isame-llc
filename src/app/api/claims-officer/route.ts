import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

export async function GET() {
  const payload = await getPayload()

  // 1. Pending Review - Accounts sent to legal by collectors
  const pendingAccounts = await payload.find({
    collection: 'accounts',
    where: {
      and: [{ status: { equals: 'legal' } }, { legalStatus: { equals: 'pending_review' } }],
    },
    sort: '-currentBalance',
    limit: 100,
    depth: 1,
  })

  // 2. Court Ready - Accounts with court documents, not yet assigned to court agent
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
          or: [{ assignedCourtAgent: { exists: false } }],
        },
      ],
    },
    sort: '-currentBalance',
    limit: 100,
    depth: 1,
  })

  // 3. Active Legal Cases - Already assigned or in court
  const activeLegalCases = await payload.find({
    collection: 'legal-cases',
    where: { status: { not_equals: 'closed' } },
    sort: '-createdAt',
    limit: 50,
    depth: 2,
  })

  // 4. Court agents for assignment
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
