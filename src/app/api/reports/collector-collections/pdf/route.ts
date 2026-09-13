import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getActiveRole } from '@/lib/getActiveRole'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activeRole = await getActiveRole(user)
  const isManagement = ['admin', 'crm-manager', 'supervisor'].includes(activeRole)
  if (!isManagement) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const collectorIds = searchParams.get('collectors')?.split(',').filter(Boolean) || []
  const clientId = searchParams.get('client') || ''

  // ── Fetch same data as JSON route ──
  const where: any = { and: [{ status: { equals: 'completed' } }] }
  if (from || to) {
    const dc: any = {}
    if (from) dc.greater_than_equal = new Date(from + 'T00:00:00').toISOString()
    if (to) dc.less_than_equal = new Date(to + 'T23:59:59').toISOString()
    where.and.push({ createdAt: dc })
  }
  if (collectorIds.length > 0) where.and.push({ collectedBy: { in: collectorIds } })

  const payments = await payload.find({
    collection: 'payments',
    where,
    limit: 100000,
    depth: 2,
    sort: '-createdAt',
  })

  // Refunds for header note
  const refundedWhere: any = { and: [{ status: { equals: 'refunded' } }] }
  if (from || to) {
    const dc: any = {}
    if (from) dc.greater_than_equal = new Date(from + 'T00:00:00').toISOString()
    if (to) dc.less_than_equal = new Date(to + 'T23:59:59').toISOString()
    refundedWhere.and.push({ createdAt: dc })
  }
  if (collectorIds.length > 0) refundedWhere.and.push({ collectedBy: { in: collectorIds } })

  const refunded = await payload.find({
    collection: 'payments',
    where: refundedWhere,
    limit: 10000,
    depth: 0,
  })

  const refundedCount = refunded.docs.length
  const refundedTotal = refunded.docs.reduce((s: number, p: any) => s + (p.amount ?? 0), 0)

  // ── Fetch CRM settings for branding ──
  let settings: any = null
  try {
    const s = await payload.find({ collection: 'crm-settings', limit: 1 })
    settings = s.docs[0]
  } catch {}

  const r = settings?.receipt || {}
  const companyName = r.companyName || 'ISAME CREDIT COLLECTION LTD'
  const companyAddress = r.companyAddress || 'Belize City, Belize'
  const companyPhone = r.companyPhone || ''
  const companyEmail = r.companyEmail || ''
  const companyWebsite = r.companyWebsite || 'www.isame.co'
  const logoUrl = r.receiptLogo?.url || null

  // ── Group rows by collector ──
  type Row = {
    date: string
    accountNumber: string
    debtorName: string
    clientName: string
    method: string
    amount: number
    isameShare: number
    clientShare: number
    reference: string
  }

  const groups: Record<
    string,
    { name: string; rows: Row[]; total: number; isame: number; client: number }
  > = {}

  for (const p of payments.docs as any[]) {
    const account = typeof p.account === 'object' ? p.account : null
    const client = account && typeof account.client === 'object' ? account.client : null
    const collector = typeof p.collectedBy === 'object' ? p.collectedBy : null

    if (clientId && client?.id !== clientId) continue

    const amount = p.amount ?? 0
    const isameShare = Math.round(amount * 0.2 * 100) / 100
    const clientShare = Math.round(amount * 0.8 * 100) / 100

    const collectorId = collector?.id || 'unknown'
    const collectorName = collector?.name || 'Unknown'

    if (!groups[collectorId]) {
      groups[collectorId] = { name: collectorName, rows: [], total: 0, isame: 0, client: 0 }
    }

    groups[collectorId].rows.push({
      date: p.date
        ? new Date(p.date).toISOString().slice(0, 10)
        : new Date(p.createdAt).toISOString().slice(0, 10),
      accountNumber: account?.accountNumber || 'N/A',
      debtorName: account?.debtorName || '',
      clientName: client?.name || 'Unassigned',
      method: p.method || 'cash',
      amount,
      isameShare,
      clientShare,
      reference: p.reference || p.transactionId || '',
    })

    groups[collectorId].total += amount
    groups[collectorId].isame += isameShare
    groups[collectorId].client += clientShare
  }

  // ── Generate PDF ──
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height

  // Pre-load logo as base64
  let logoBase64: string | null = null
  let logoFormat: 'PNG' | 'JPEG' = 'PNG'
  if (logoUrl) {
    try {
      const res = await fetch(logoUrl)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer()).toString('base64')
        const ext = logoUrl.split('.').pop()?.toLowerCase() || 'png'
        logoFormat = ext === 'jpg' || ext === 'jpeg' ? 'JPEG' : 'PNG'
        logoBase64 = `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buf}`
      }
    } catch {}
  }

  const dateRangeLabel =
    from && to
      ? `${formatDate(from)} – ${formatDate(to)}`
      : from
        ? `From ${formatDate(from)}`
        : to
          ? `Through ${formatDate(to)}`
          : 'All time'

  const collectorList = Object.values(groups)
  const grandTotal = collectorList.reduce((s, g) => s + g.total, 0)
  const grandIsame = collectorList.reduce((s, g) => s + g.isame, 0)
  const grandClient = collectorList.reduce((s, g) => s + g.client, 0)

  // ── Header function (re-drawn on every page) ──
  const drawHeader = (collectorName: string) => {
    // Logo
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, logoFormat, 14, 10, 20, 20)
      } catch {}
    }

    // Company header
    doc.setFontSize(14)
    doc.setTextColor(20)
    doc.text(companyName, 40, 18)
    doc.setFontSize(8)
    doc.setTextColor(100)
    const line = [companyAddress, companyPhone, companyEmail, companyWebsite]
      .filter(Boolean)
      .join(' | ')
    doc.text(line, 40, 24)

    doc.setDrawColor(200)
    doc.line(14, 32, pageWidth - 14, 32)

    // Title
    doc.setFontSize(12)
    doc.setTextColor(20)
    doc.text('Collector Collection Report', pageWidth / 2, 40, { align: 'center' })

    doc.setFontSize(9)
    doc.setTextColor(80)
    doc.text(`Collector: ${collectorName}`, 14, 48)
    doc.text(`Period: ${dateRangeLabel}`, 14, 54)
    doc.text(
      `Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/Belize' })}`,
      pageWidth - 14,
      48,
      { align: 'right' },
    )

    if (refundedCount > 0) {
      doc.setTextColor(180, 60, 60)
      doc.text(
        `Note: ${refundedCount} refunded payment(s) totaling $${refundedTotal.toFixed(2)} are excluded from this report.`,
        14,
        60,
      )
    }

    return 66
  }

  if (collectorList.length === 0) {
    doc.setFontSize(14)
    doc.text('No collections found for the selected filters.', pageWidth / 2, 100, {
      align: 'center',
    })
  } else {
    // ── One page per collector ──
    for (let i = 0; i < collectorList.length; i++) {
      const g = collectorList[i]
      if (i > 0) doc.addPage()

      const startY = drawHeader(g.name)

      autoTable(doc, {
        startY,
        head: [
          [
            'Date',
            'Account #',
            'Debtor',
            'Client',
            'Method',
            'Payment',
            'ISAME (20%)',
            'Client (80%)',
            'Ref',
          ],
        ],
        body: g.rows.map((r) => [
          r.date,
          r.accountNumber,
          r.debtorName.slice(0, 25),
          r.clientName.slice(0, 20),
          r.method.replace('_', ' '),
          `$${r.amount.toFixed(2)}`,
          `$${r.isameShare.toFixed(2)}`,
          `$${r.clientShare.toFixed(2)}`,
          r.reference.slice(0, 15),
        ]),
        foot: [
          [
            '',
            '',
            '',
            '',
            'TOTAL',
            `$${g.total.toFixed(2)}`,
            `$${g.isame.toFixed(2)}`,
            `$${g.client.toFixed(2)}`,
            '',
          ],
        ],
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontSize: 7 },
        footStyles: {
          fillColor: [230, 230, 230],
          textColor: [20, 20, 20],
          fontStyle: 'bold',
          fontSize: 7,
        },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 22 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
          4: { cellWidth: 18 },
          5: { halign: 'right', cellWidth: 20 },
          6: { halign: 'right', cellWidth: 20 },
          7: { halign: 'right', cellWidth: 20 },
          8: { cellWidth: 20 },
        },
        didDrawPage: (data: any) => {
          // Footer with page number
          doc.setFontSize(7)
          doc.setTextColor(150)
          doc.text(`Page ${data.pageNumber}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
        },
      })
    }

    // ── Final page: Grand total ──
    doc.addPage()
    drawHeader('Grand Total — All Collectors')

    autoTable(doc, {
      startY: 66,
      head: [['Collector', 'Payments', 'Total Collected', 'ISAME (20%)', 'Client (80%)']],
      body: collectorList.map((g) => [
        g.name,
        String(g.rows.length),
        `$${g.total.toFixed(2)}`,
        `$${g.isame.toFixed(2)}`,
        `$${g.client.toFixed(2)}`,
      ]),
      foot: [
        [
          'GRAND TOTAL',
          String(collectorList.reduce((s, g) => s + g.rows.length, 0)),
          `$${grandTotal.toFixed(2)}`,
          `$${grandIsame.toFixed(2)}`,
          `$${grandClient.toFixed(2)}`,
        ],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
      footStyles: { fillColor: [200, 220, 240], textColor: [20, 20, 20], fontStyle: 'bold' },
    })
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  const fname = `collector-collections-${from || 'all'}-to-${to || 'all'}.pdf`

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fname}"`,
    },
  })
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Belize',
  })
}
