import { getPayload } from '@/payload'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { account, amount, method, reference, notes, date, status } = body

  if (!account || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const payload = await getPayload()

  try {
    // Create the payment
    const payment = await payload.create({
      collection: 'payments',
      data: {
        account,
        amount: parseFloat(amount),
        method: method || 'cash',
        reference: reference || undefined,
        notes: notes || undefined,
        date: date || new Date().toISOString().split('T')[0],
        status: status || 'completed',
      },
    })

    // Update account balance
    const accountDoc = await payload.findByID({ collection: 'accounts', id: account })
    const newPaymentsReceived = (accountDoc.paymentsReceived || 0) + parseFloat(amount)
    const newBalance = Math.max(0, (accountDoc.currentBalance || 0) - parseFloat(amount))
    const totalCollectable = accountDoc.totalCollectable || accountDoc.currentBalance || 0
    const newStatus = newBalance <= 0 ? 'settled' : accountDoc.status

    await payload.update({
      collection: 'accounts',
      id: account,
      data: {
        paymentsReceived: newPaymentsReceived,
        currentBalance: newBalance,
        status: newStatus,
      },
    })

    // Generate receipt URL
    const receiptUrl = `/api/payments/receipt/${payment.id}`

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      receiptUrl,
      newBalance,
      newPaymentsReceived,
    })
  } catch (error: any) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
