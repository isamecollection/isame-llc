// src/app/api/payments/[id]/void/route.ts
import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isManagementRole } from '@/lib/permissions'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roles: string[] = user.roles || []
  const hasPermission = roles.some((role) => isManagementRole(role))

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    const payment = await payload.findByID({
      collection: 'payments',
      id,
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status === 'refunded') {
      return NextResponse.json({ error: 'Payment already refunded' }, { status: 400 })
    }

    const accountId =
      typeof payment.account === 'string'
        ? payment.account
        : (payment.account as any).id || (payment.account as any)._id

    if (!accountId) {
      return NextResponse.json({ error: 'Account not found on payment' }, { status: 400 })
    }

    // Capture pre-reversal balance for the response payload only.
    const accountBefore = await payload.findByID({
      collection: 'accounts',
      id: accountId,
    })
    const previousBalance = accountBefore.currentBalance || 0

    const voidNote = `REFUNDED: ${reason} (Voided by ${user.email} on ${new Date().toISOString()})`
    const updatedNotes = payment.notes ? `${payment.notes}\n${voidNote}` : voidNote

    // Update the payment status → afterChangePayment hook handles ALL
    // balance reversal atomically (currentBalance, paymentsReceived,
    // status flip back to 'active' if it was 'paid', event log).
    await payload.update({
      collection: 'payments',
      id,
      data: {
        status: 'refunded',
        notes: updatedNotes,
      },
    })

    // Re-fetch the account to pick up the hook's atomic update.
    const accountAfter = await payload.findByID({
      collection: 'accounts',
      id: accountId,
    })

    return NextResponse.json({
      success: true,
      message: 'Payment voided successfully',
      paymentId: id,
      reversedAmount: payment.amount,
      previousBalance,
      newBalance: accountAfter.currentBalance,
      newPaymentsReceived: accountAfter.paymentsReceived,
    })
  } catch (error: any) {
    console.error('Error voiding payment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}