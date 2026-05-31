import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const payload = await getPayload()

  // Fetch all clients
  const clients = await payload.find({
    collection: 'clients',
    sort: 'name',
  })

  const rows: any[] = []

  for (const client of clients.docs) {
    // Get ALL accounts for this client (fix pagination)
    const accounts = await payload.find({
      collection: 'accounts',
      where: { client: { equals: client.id } },
      limit: 9999, // ← ADD THIS
    })

    let totalCollectable = 0
    let totalCollected = 0
    let totalOutstanding = 0
    let totalIsameCharge = 0

    for (const account of accounts.docs) {
      const collectable = account.totalCollectable || 0
      const collected = account.paymentsReceived || 0
      const outstanding = account.currentBalance || 0
      const fee = account.fee20Percent || 0

      totalCollectable += collectable
      totalCollected += collected
      totalOutstanding += outstanding
      totalIsameCharge += fee
    }

    // Anonymize client name
    const originalName = client.name || 'Unknown'
    let anonymized = ''
    if (originalName.length > 1) {
      anonymized = originalName.charAt(0) + 'xxx' + originalName.charAt(originalName.length - 1)
    } else {
      anonymized = originalName + 'xxx'
    }

    rows.push([
      anonymized,
      accounts.totalDocs,
      `$${totalCollectable.toLocaleString()}`,
      `$${totalCollected.toLocaleString()}`,
      `$${totalOutstanding.toLocaleString()}`,
      `$${totalIsameCharge.toLocaleString()}`,
    ])
  }

  // Create PDF
  const doc = new jsPDF()

  // Logo (if available)
  let logoBase64 = ''
  try {
    const logoPath = path.join(process.cwd(), 'public', 'icon-192.png')
    const logoData = fs.readFileSync(logoPath)
    logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`
  } catch {}

  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20)
  }

  // Company info
  doc.setFontSize(11)
  doc.text('Isame Credit Collection', 40, 14)
  doc.setFontSize(9)
  doc.text('Hasy Mejia', 40, 19)
  doc.text('hasly.mejia@isame.co | +501 600-6106', 40, 24)
  doc.text('www.isame.co', 40, 29)

  doc.setDrawColor(200)
  doc.line(14, 35, 196, 35)

  // Title
  doc.setFontSize(14)
  doc.text('Client Recovery Report', 14, 44)

  // Table - updated headers with Total Collectable
  autoTable(doc, {
    startY: 50,
    head: [
      ['Client', 'Accounts', 'Total Collectable', 'Collected', 'Outstanding', 'Isame Fee (20%)'],
    ],
    body: rows,
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 18 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
    },
  })

  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} by Isame Credit Collection`,
    14,
    pageHeight - 10,
  )

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="isame-client-report.pdf"',
    },
  })
}
