import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'

// Use `as const` so each slug is a literal, matching Payload's collection union
const relatedCollections = [
  'payments',
  'agreements',
  'scheduled-payments',
  'notes',
  'call-attempts',
  'debtor-references',
  'legal-cases',
] as const

export async function POST(request: Request) {
  const payload = await getPayload()

  // Authenticate using the cookie sent with the request
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !user.roles?.some((r) => ['crm-manager', 'admin'].includes(r))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sourceId, targetId, combineBalances } = await request.json()
  if (!sourceId || !targetId)
    return NextResponse.json({ error: 'Missing sourceId or targetId' }, { status: 400 })
  if (sourceId === targetId)
    return NextResponse.json({ error: 'Cannot merge an account into itself' }, { status: 400 })

  let source, target
  try {
    source = await payload.findByID({ collection: 'accounts', id: sourceId })
    target = await payload.findByID({ collection: 'accounts', id: targetId })
  } catch (error) {
    return NextResponse.json({ error: 'Source or target account not found' }, { status: 404 })
  }

  // Transfer all related records
  for (const collection of relatedCollections) {
    const docs = await payload.find({
      collection,
      where: { account: { equals: sourceId } },
      limit: 1000,
    })
    for (const doc of docs.docs) {
      await payload.update({
        collection,
        id: doc.id,
        data: { account: targetId },
      })
    }
  }

  // Optionally combine balances
  if (combineBalances) {
    const newBalance = (target.currentBalance ?? 0) + (source.currentBalance ?? 0)
    await payload.update({
      collection: 'accounts',
      id: targetId,
      data: { currentBalance: newBalance },
    })
  }

  // Log merge event
  await payload.create({
    collection: 'events',
    data: {
      type: 'account.merged',
      account: targetId,
      data: {
        sourceAccountId: sourceId,
        combineBalances,
        timestamp: new Date().toISOString(),
      },
    },
  })

  // Delete the source account
  await payload.delete({ collection: 'accounts', id: sourceId })

  return NextResponse.json({ success: true, targetId })
}
