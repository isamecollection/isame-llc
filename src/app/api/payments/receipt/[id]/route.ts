import { getPayload } from '@/payload'
import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload()

  const payment = await payload.findByID({
    collection: 'payments',
    id,
    depth: 1,
  })

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  const account = payment.account as any
  const client = account?.client as any

  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text('PAYMENT RECEIPT', 105, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.text('Isame Credit Collection', 105, 30, { align: 'center' })
  doc.text('www.isame.co', 105, 35, { align: 'center' })

  // Line
  doc.setDrawColor(200)
  doc.line(20, 42, 190, 42)

  // Receipt details
  doc.setFontSize(11)
  doc.text(`Receipt #: REC-${payment.id.slice(-8).toUpperCase()}`, 20, 52)
  doc.text(`Date: ${new Date(payment.date || payment.createdAt).toLocaleDateString()}`, 20, 59)
  doc.text(`Payment Method: ${(payment.method || 'cash').replace('_', ' ').toUpperCase()}`, 20, 66)

  // Account info
  doc.setFontSize(10)
  doc.text('PAID BY:', 20, 78)
  doc.setFontSize(11)
  doc.text(account?.debtorName || 'Unknown', 20, 85)
  doc.text(`Account #: ${account?.accountNumber || 'N/A'}`, 20, 92)

  if (client) {
    doc.text(`Client: ${client.name || 'N/A'}`, 20, 99)
  }

  // Amount
  doc.setDrawColor(200)
  doc.line(20, 108, 190, 108)

  doc.setFontSize(16)
  doc.text(`Amount Paid: $${payment.amount?.toLocaleString()}`, 20, 120)

  // Reference
  if (payment.reference) {
    doc.setFontSize(10)
    doc.text(`Reference: ${payment.reference}`, 20, 132)
  }

  // Notes
  if (payment.notes) {
    doc.setFontSize(9)
    doc.text(`Notes: ${payment.notes}`, 20, 142)
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
