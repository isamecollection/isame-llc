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
  const collector = payment.collectedBy as any

  const balanceBefore = (account?.currentBalance || 0) + (payment.amount || 0)
  const balanceAfter = account?.currentBalance || 0

  const doc = new jsPDF()

  // ── Logo ──
  try {
    const logoUrl =
      'https://res.cloudinary.com/dwkbus18m/image/upload/v1780403341/media/hwj58ryz38rlqiflp5ha.jpg'
    const logoRes = await fetch(logoUrl)
    if (logoRes.ok) {
      const logoBuffer = await logoRes.arrayBuffer()
      const logoBase64 = Buffer.from(logoBuffer).toString('base64')
      doc.addImage(`data:image/jpeg;base64,${logoBase64}`, 'JPEG', 14, 10, 22, 22)
    }
  } catch {}

  // ── Company Header ──
  doc.setFontSize(16)
  doc.text('ISAME COLLECTIONS', 42, 20)
  doc.setFontSize(8)
  doc.text('Belize City, Belize | www.isame.co', 42, 27)
  doc.setDrawColor(200)
  doc.line(14, 34, 196, 34)

  // ── Receipt Title ──
  doc.setFontSize(14)
  doc.text('PAYMENT RECEIPT', 105, 44, { align: 'center' })

  // ── Receipt Number & Status ──
  const receiptNumber = `RCPT-${new Date(payment.createdAt).toISOString().split('T')[0].replace(/-/g, '')}-${payment.id.slice(-6).toUpperCase()}`
  doc.setFontSize(8)
  doc.text(`Receipt #: ${receiptNumber}`, 14, 54)
  doc.text(`Status: ${(payment.status || 'completed').toUpperCase()}`, 14, 60)

  // ── Date & Time ──
  doc.text(
    `Date: ${new Date(payment.date || payment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    105,
    54,
  )
  doc.text(
    `Time: ${new Date(payment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
    105,
    60,
  )

  // ── Recorded By ──
  if (collector) {
    doc.text(`Recorded By: ${collector.name || 'System'}`, 14, 68)
  }

  // ── Divider ──
  doc.setDrawColor(220)
  doc.line(14, 74, 196, 74)

  // ── Account Info ──
  doc.setFontSize(9)
  doc.text('PAID BY', 14, 84)
  doc.setFontSize(11)
  doc.text(account?.debtorName || 'Unknown', 14, 91)
  doc.setFontSize(9)
  doc.text(`Account #: ${account?.accountNumber || 'N/A'}`, 14, 98)
  if (client) {
    doc.text(`Client: ${client.name || 'N/A'}`, 14, 105)
  }

  // ── Payment Details Box ──
  let yBox = client ? 113 : 106
  doc.setDrawColor(200)
  doc.setFillColor(248, 250, 252)
  doc.rect(14, yBox, 182, 42, 'FD')

  doc.setFontSize(10)
  doc.text('Balance Before Payment:', 20, yBox + 10)
  doc.text('Payment Amount:', 20, yBox + 22)
  doc.text('Balance After Payment:', 20, yBox + 34)

  doc.setFontSize(12)
  doc.text(`$${balanceBefore.toLocaleString()}`, 160, yBox + 10, { align: 'right' })
  doc.text(`- $${payment.amount?.toLocaleString()}`, 160, yBox + 22, { align: 'right' })
  doc.text(`$${balanceAfter.toLocaleString()}`, 160, yBox + 34, { align: 'right' })

  // ── Payment Method & Reference ──
  let yDetails = yBox + 50
  doc.setFontSize(9)
  doc.text(`Method: ${(payment.method || 'cash').replace('_', ' ').toUpperCase()}`, 14, yDetails)
  yDetails += 6
  if (payment.reference) {
    doc.text(`Reference: ${payment.reference}`, 14, yDetails)
    yDetails += 6
  }

  // ── Bank Transfer Details ──
  if (
    (payment.method === 'bank_transfer' || payment.method === 'online') &&
    (payment.bankFrom || payment.accountFrom || payment.bankTo)
  ) {
    yDetails += 4
    doc.setDrawColor(220)
    doc.line(14, yDetails, 196, yDetails)
    yDetails += 7
    doc.setFontSize(9)
    doc.text('BANK TRANSFER DETAILS', 14, yDetails)
    doc.setFontSize(8)
    yDetails += 6

    if (payment.bankFrom) {
      doc.text(`From Bank: ${payment.bankFrom}`, 14, yDetails)
      yDetails += 5
    }
    if (payment.accountFrom) {
      doc.text(`From Account: ${payment.accountFrom}`, 14, yDetails)
      yDetails += 5
    }
    if (payment.accountFromName) {
      doc.text(`Account Name: ${payment.accountFromName}`, 14, yDetails)
      yDetails += 5
    }
    if (payment.bankTo) {
      doc.text(`To Bank: ${payment.bankTo}`, 14, yDetails)
      yDetails += 5
    }
    if (payment.accountTo) {
      doc.text(`To Account: ${payment.accountTo}`, 14, yDetails)
      yDetails += 5
    }
    if (payment.transferTime) {
      doc.text(`Transfer Time: ${payment.transferTime}`, 14, yDetails)
      yDetails += 5
    }
  }

  // ── Footer ──
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(7)
  doc.setTextColor(150)
  doc.text('ISAME Collections LLC | Belize City, Belize | www.isame.co', 105, pageHeight - 12, {
    align: 'center',
  })
  doc.text(
    'This receipt acknowledges payment received toward the referenced account.',
    105,
    pageHeight - 8,
    { align: 'center' },
  )
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, pageHeight - 4, { align: 'center' })

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receipt-${payment.id.slice(-8)}.pdf"`,
    },
  })
}
