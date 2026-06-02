import { getPayload } from '@/payload'
import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload()

  const payment = (await payload.findByID({
    collection: 'payments',
    id,
    depth: 1,
  })) as any

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  const account = payment.account as any
  const client = account?.client as any

  // Calculate balance before by adding this payment back
  const balanceBefore = (account?.currentBalance || 0) + (payment.amount || 0)
  const balanceAfter = account?.currentBalance || 0

  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text('PAYMENT RECEIPT', 105, 20, { align: 'center' })
  doc.setFontSize(10)
  doc.text('Isame Credit Collection', 105, 30, { align: 'center' })
  doc.text('www.isame.co', 105, 35, { align: 'center' })
  doc.setDrawColor(200)
  doc.line(20, 42, 190, 42)

  // Receipt Info
  doc.setFontSize(11)
  doc.text(`Receipt #: REC-${payment.id.slice(-8).toUpperCase()}`, 20, 52)
  doc.text(`Date: ${new Date(payment.date || payment.createdAt).toLocaleDateString()}`, 20, 59)
  doc.text(`Time: ${new Date(payment.createdAt).toLocaleTimeString()}`, 20, 66)
  doc.text(`Method: ${(payment.method || 'cash').replace('_', ' ').toUpperCase()}`, 20, 73)

  if (payment.reference) {
    doc.text(`Reference: ${payment.reference}`, 20, 80)
  }

  // Debtor Info
  doc.setFontSize(10)
  doc.text('PAID BY:', 20, 95)
  doc.setFontSize(11)
  doc.text(account?.debtorName || 'Unknown', 20, 102)
  doc.text(`Account #: ${account?.accountNumber || 'N/A'}`, 20, 109)
  if (client) {
    doc.text(`Client: ${client.name || 'N/A'}`, 20, 116)
  }

  // Payment Details Box
  doc.setDrawColor(200)
  doc.setFillColor(245, 245, 245)
  doc.rect(20, 125, 170, 40, 'FD')

  doc.setFontSize(11)
  doc.text('Balance Before Payment:', 30, 137)
  doc.text('Payment Amount:', 30, 149)
  doc.text('Balance After Payment:', 30, 161)

  doc.setFontSize(12)
  doc.text(`$${balanceBefore.toLocaleString()}`, 140, 137, { align: 'right' })
  doc.text(`- $${payment.amount?.toLocaleString()}`, 140, 149, { align: 'right' })
  doc.text(`$${balanceAfter.toLocaleString()}`, 140, 161, { align: 'right' })

  // Bank Transfer Details
  if (
    (payment.method === 'bank_transfer' || payment.method === 'online') &&
    (payment.bankFrom || payment.accountFrom || payment.bankTo)
  ) {
    let yPos = 175
    doc.setFontSize(11)
    doc.text('Bank Transfer Details', 20, yPos)
    doc.setFontSize(9)
    yPos += 8

    if (payment.bankFrom) {
      doc.text(`From Bank: ${payment.bankFrom}`, 20, yPos)
      yPos += 7
    }
    if (payment.accountFrom) {
      doc.text(`From Account #: ${payment.accountFrom}`, 20, yPos)
      yPos += 7
    }
    if (payment.accountFromName) {
      doc.text(`Account Name: ${payment.accountFromName}`, 20, yPos)
      yPos += 7
    }
    if (payment.bankTo) {
      doc.text(`To Bank: ${payment.bankTo}`, 20, yPos)
      yPos += 7
    }
    if (payment.accountTo) {
      doc.text(`To Account #: ${payment.accountTo}`, 20, yPos)
      yPos += 7
    }
    if (payment.transferTime) {
      doc.text(`Transfer Time: ${payment.transferTime}`, 20, yPos)
      yPos += 7
    }
  }

  // Notes
  if (payment.notes) {
    doc.setFontSize(9)
    doc.text(`Notes: ${payment.notes}`, 20, 250)
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(`Generated on ${new Date().toLocaleDateString()} by Isame Credit Collection`, 105, 280, {
    align: 'center',
  })

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receipt-${payment.id.slice(-8)}.pdf"`,
    },
  })
}
