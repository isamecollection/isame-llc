import type { CollectionAfterChangeHook } from 'payload'

export const afterChangePayment: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const { payload } = req

  if (operation === 'update' && doc.status === 'completed' && previousDoc?.status !== 'completed') {
    // Fetch the linked account
    const account = await payload.findByID({
      collection: 'accounts',
      id: typeof doc.account === 'string' ? doc.account : doc.account?.id,
    })

    if (!account) return doc

    // Use 0 if currentBalance is null/undefined
    const currentBalance = account.currentBalance ?? 0
    const paymentAmount = doc.amount ?? 0

    // Update account balance
    await payload.update({
      collection: 'accounts',
      id: account.id,
      data: {
        currentBalance: currentBalance - paymentAmount,
      },
    })

    // Log the payment event
    await payload.create({
      collection: 'events',
      data: {
        type: 'payment.received',
        account: account.id,
        data: { paymentId: doc.id, amount: paymentAmount },
      },
    })

    // If balance reaches zero, mark account as paid
    if (currentBalance - paymentAmount <= 0) {
      await payload.update({
        collection: 'accounts',
        id: account.id,
        data: { status: 'paid' },
      })
    }
  }

  return doc
}
