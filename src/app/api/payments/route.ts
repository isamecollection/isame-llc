// app/api/payments/route.ts
import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { canRecordPayment } from '@/lib/permissions'

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

// POST - Create payment.
// NOTE: This route no longer touches account balance directly.
// The afterChangePayment hook owns ALL balance math:
//   - currentBalance decrement (atomic $inc)
//   - paymentsReceived increment
//   - balanceBefore/balanceAfter snapshot on the payment record
//   - status flip to 'paid' when balance hits 0
//   - event log entry
export async function POST(request: NextRequest) {
  // Authenticate & Authorize
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if ANY role can record payments (not just the highest)
  const roles: string[] = user.roles || []
  const hasPermission = roles.some((role) => canRecordPayment(role))

  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Forbidden - No role with payment permission' },
      { status: 403 },
    )
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
    // Read pre-payment balance for the response payload only.
    // The hook will do the authoritative update.
    const accountDoc = await payload.findByID({ collection: 'accounts', id: account })
    const balanceBefore = accountDoc.currentBalance || 0

    // Create the payment — the afterChangePayment hook handles the rest.
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

    // Re-fetch the account to pick up the hook's atomic update.
    const updatedAccount = await payload.findByID({ collection: 'accounts', id: account })

    const receiptUrl = `/api/payments/receipt/${payment.id}`

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      receiptUrl,
      balanceBefore,
      balanceAfter: updatedAccount.currentBalance,
      paymentAmount: parseFloat(amount),
      newBalance: updatedAccount.currentBalance,
      newPaymentsReceived: updatedAccount.paymentsReceived,
    })
  } catch (error: any) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}