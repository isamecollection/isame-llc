import { getPayload } from '@/payload'
import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const payload = await getPayload()
  const accounts = await payload.find({
    collection: 'accounts',
    where: { client: { equals: clientId } },
    depth: 1,
    sort: '-currentBalance',
  })

  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text('Client Portfolio Report', 14, 20)

  const rows = accounts.docs.map((acc: any) => [
    acc.debtorName || '—',
    acc.accountNumber,
    `$${acc.currentBalance?.toLocaleString()}`,
    acc.status,
    acc.legalStatus || '—',
  ])

  autoTable(doc, {
    startY: 30,
    head: [['Debtor Name', 'Account #', 'Balance', 'Status', 'Legal Status']],
    body: rows,
  })

  // Add a chart image via QuickChart
  const chartConfig = {
    type: 'bar',
    data: {
      labels: accounts.docs.map((a: any) => a.debtorName || 'Unknown'),
      datasets: [
        {
          label: 'Balance',
          data: accounts.docs.map((a: any) => a.currentBalance || 0),
          backgroundColor: '#3b82f6',
        },
      ],
    },
  }
  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`
  const chartResponse = await fetch(chartUrl)
  if (chartResponse.ok) {
    const chartBuffer = await chartResponse.arrayBuffer()
    const base64 = Buffer.from(chartBuffer).toString('base64')
    doc.addPage()
    doc.addImage(`data:image/png;base64,${base64}`, 'PNG', 14, 20, 180, 100)
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="client-report.pdf"',
    },
  })
}
