import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const payload = await getPayload()

  // Fetch client info
  const client = await payload.findByID({ collection: 'clients', id: clientId })

  // Fetch all accounts for this client
  const accounts = await payload.find({
    collection: 'accounts',
    where: { client: { equals: clientId } },
    depth: 1,
    sort: '-currentBalance',
  })

  // For each account, fetch agreements, payments, legal cases
  const accountDetails = await Promise.all(
    accounts.docs.map(async (acc) => {
      const [agreements, payments, legalCases] = await Promise.all([
        payload.find({ collection: 'agreements', where: { account: { equals: acc.id } } }),
        payload.find({
          collection: 'payments',
          where: { account: { equals: acc.id }, status: { equals: 'completed' } },
          sort: '-date',
        }),
        payload.find({ collection: 'legal-cases', where: { account: { equals: acc.id } } }),
      ])

      const totalRecovered = payments.docs.reduce((sum, p) => sum + (p.amount ?? 0), 0)
      const promises = agreements.docs.filter(
        (a) => a.status === 'active' || a.status === 'pending',
      ).length
      const broken = agreements.docs.filter((a) => a.status === 'breached').length
      const legalCase = legalCases.docs[0]
      const courtStatus = legalCase ? legalCase.status : '—'
      const nextEvent = legalCase?.courtEvents
        ?.filter((ev: any) => new Date(ev.eventDate) > new Date())
        .sort(
          (a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
        )[0]

      return {
        debtorName: acc.debtorName || 'Unknown',
        accountNumber: acc.accountNumber,
        balance: acc.currentBalance ?? 0,
        status: acc.status,
        totalRecovered,
        promises,
        broken,
        courtStatus,
        nextEventDate: nextEvent ? new Date(nextEvent.eventDate).toLocaleDateString() : '—',
        nextEventType: nextEvent ? nextEvent.eventType : '—',
      }
    }),
  )

  // Totals
  const totalOutstanding = accountDetails.reduce((sum, a) => sum + a.balance, 0)
  const totalRecovered = accountDetails.reduce((sum, a) => sum + a.totalRecovered, 0)
  const isameCharge = totalRecovered * 0.2

  // Build PDF
  const doc = new jsPDF()

  // --- Logo ---
  let logoBase64 = ''
  try {
    const logoPath = path.join(process.cwd(), 'public', 'icon-192.png')
    const logoData = fs.readFileSync(logoPath)
    logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`
  } catch {}

  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20)
  }

  // --- Company info ---
  doc.setFontSize(11)
  doc.text('Isame Credit Collection', 40, 14)
  doc.setFontSize(9)
  doc.text('Hasly Mejia', 40, 19)
  doc.text('hasly.mejia@isame.co | +501 600-6106', 40, 24)
  doc.text('www.isame.co', 40, 29)

  doc.setDrawColor(200)
  doc.line(14, 35, 196, 35)

  // Title
  doc.setFontSize(14)
  doc.text(`Client Report – ${client.name}`, 14, 44)

  // Account detail table
  const rows = accountDetails.map((a) => [
    a.debtorName || 'Unknown',
    a.accountNumber || '—',
    `$${a.balance.toLocaleString()}`,
    a.status || '—',
    `$${a.totalRecovered.toLocaleString()}`,
    a.promises.toString(),
    a.broken.toString(),
    a.courtStatus || '—',
    a.nextEventDate || '—',
    a.nextEventType || '—',
  ])

  autoTable(doc, {
    startY: 50,
    head: [
      [
        'Debtor',
        'Account #',
        'Balance',
        'Status',
        'Recovered',
        'Promises',
        'Broken',
        'Court',
        'Next Event Date',
        'Type',
      ],
    ],
    body: rows,
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 7, cellPadding: 1.5 },
    columnStyles: {
      8: { cellWidth: 22 },
      9: { cellWidth: 20 },
    },
  })

  // Summary section
  const finalY = (doc as any).lastAutoTable?.finalY + 10 || 100
  doc.setFontSize(10)
  doc.text('Summary', 14, finalY)
  doc.setFontSize(8)
  doc.text(`Total Outstanding: $${totalOutstanding.toLocaleString()}`, 14, finalY + 5)
  doc.text(`Total Recovered: $${totalRecovered.toLocaleString()}`, 14, finalY + 10)
  doc.text(`Isame Charge (20%): $${isameCharge.toLocaleString()}`, 14, finalY + 15)

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
      'Content-Disposition': `attachment; filename="client-report-${client.name}.pdf"`,
    },
  })
}
