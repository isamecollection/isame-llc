import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getHighestRole, canRecordPayment } from '@/lib/permissions'

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
  // Authenticate & Authorize
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const effectiveRole = getHighestRole(user.roles || [])
  if (!canRecordPayment(effectiveRole)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

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

  try {
    const accountDoc = await payload.findByID({ collection: 'accounts', id: account })
    const balanceBefore = accountDoc.currentBalance || 0

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

    const newPaymentsReceived = (accountDoc.paymentsReceived || 0) + parseFloat(amount)
    const balanceAfter = Math.max(0, balanceBefore - parseFloat(amount))
    const newStatus = balanceAfter <= 0 ? 'settled' : accountDoc.status

    await payload.update({
      collection: 'accounts',
      id: account,
      data: {
        paymentsReceived: newPaymentsReceived,
        currentBalance: balanceAfter,
        status: newStatus,
      },
    })

    const receiptUrl = `/api/payments/receipt/${payment.id}`

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      receiptUrl,
      balanceBefore,
      balanceAfter,
      paymentAmount: parseFloat(amount),
      newBalance: balanceAfter,
      newPaymentsReceived,
    })
  } catch (error: any) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
