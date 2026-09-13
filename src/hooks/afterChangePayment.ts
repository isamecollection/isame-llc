import type { CollectionAfterChangeHook } from 'payload'

export const afterChangePayment: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const { payload } = req

  if (req.context?.__paymentHookSkip) return doc

  const wasCompleted = previousDoc?.status === 'completed'
  const isCompleted = doc.status === 'completed'

  const shouldApply =
    (operation === 'create' && isCompleted) ||
    (operation === 'update' && isCompleted && !wasCompleted)

  const shouldReverse = operation === 'update' && !isCompleted && wasCompleted

  if (!shouldApply && !shouldReverse) return doc

  const accountId = typeof doc.account === 'string' ? doc.account : doc.account?.id
  if (!accountId) return doc

  const account = await payload.findByID({ collection: 'accounts', id: accountId })
  if (!account) return doc

  const paymentAmount = doc.amount ?? 0
  const delta = shouldApply ? -paymentAmount : paymentAmount

  let balanceBefore = account.currentBalance ?? 0
  let balanceAfter = balanceBefore + delta

  try {
    const result = await (payload.db as any).collections.accounts.findOneAndUpdate(
      { _id: account.id },
      { $inc: { currentBalance: delta } },
      { returnDocument: 'after' },
    )
    const updated = result?.value ?? result
    if (updated?.currentBalance !== undefined) {
      balanceAfter = Math.round(updated.currentBalance * 100) / 100
      balanceBefore = Math.round((balanceAfter - delta) * 100) / 100
    }
  } catch {
    const newBalance = Math.max(0, Math.round((balanceBefore + delta) * 100) / 100)
    await payload.update({
      collection: 'accounts',
      id: account.id,
      data: { currentBalance: newBalance },
      context: { __paymentHook: true },
    })
    balanceAfter = newBalance
  }

  // ⚠️ DO NOT modify paymentsReceived here.
  // It represents "amounts paid to the lender BEFORE ISAME took over"
  // and is a static input to the collectable calculation.

  try {
    await payload.update({
      collection: 'payments',
      id: doc.id,
      data: { balanceBefore, balanceAfter },
      context: { __paymentHookSkip: true },
    })
  } catch {}

  await payload.create({
    collection: 'events',
    data: {
      type: shouldApply ? 'payment.received' : 'payment.reversed',
      account: account.id,
      data: { paymentId: doc.id, amount: paymentAmount, balanceBefore, balanceAfter },
    },
  })

  if (shouldApply && balanceAfter <= 0) {
    await payload.update({
      collection: 'accounts',
      where: {
        and: [{ id: { equals: account.id } }, { status: { not_equals: 'paid' } }],
      },
      data: { status: 'paid' },
    })
  } else if (shouldReverse && balanceAfter > 0) {
    await payload.update({
      collection: 'accounts',
      where: {
        and: [{ id: { equals: account.id } }, { status: { equals: 'paid' } }],
      },
      data: { status: 'active' },
    })
  }

  return doc
}
