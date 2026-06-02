import { getPayload } from '@/payload'
import { NextRequest, NextResponse } from 'next/server'

// GET - List payments (for payment history table)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') || '-createdAt'
  const limit = parseInt(searchParams.get('limit') || '20')
  const accountId = searchParams.get('where[account][equals]')

  const payload = await getPayload()

  const where: any = {}
  if (accountId) where.account = { equals: accountId }

  const payments = await payload.find({
    collection: 'payments',
    where,
    sort,
    limit,
    depth: 1,
  })

  return NextResponse.json(payments)
}

// POST - Create payment with balance update & receipt
export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    account,
    amount,
    method,
    reference,
    notes,
    date,
    status,
    bankFrom,
    accountFrom,
    accountFromName,
    bankTo,
    accountTo,
    transferTime,
    receiptImage,
  } = body

  if (!account || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const payload = await getPayload()

  try {
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
        bankFrom: bankFrom || undefined,
        accountFrom: accountFrom || undefined,
        accountFromName: accountFromName || undefined,
        bankTo: bankTo || undefined,
        accountTo: accountTo || undefined,
        transferTime: transferTime || undefined,
        receiptImage: receiptImage || undefined,
      },
    })

    const accountDoc = await payload.findByID({ collection: 'accounts', id: account })
    const newPaymentsReceived = (accountDoc.paymentsReceived || 0) + parseFloat(amount)
    const newBalance = Math.max(0, (accountDoc.currentBalance || 0) - parseFloat(amount))
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
