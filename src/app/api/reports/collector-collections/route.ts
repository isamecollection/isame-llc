import { getPayload } from '@/payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getActiveRole } from '@/lib/getActiveRole'

type PaymentRow = {
  id: string
  date: string | null
  createdAt: string
  collectorId: string | null
  collectorName: string
  accountId: string | null
  accountNumber: string
  debtorName: string
  clientId: string | null
  clientName: string
  method: string
  amount: number
  isameShare: number
  clientShare: number
  reference: string
}

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
  const format = searchParams.get('format') || 'json'

  // Build the where clause for completed payments only
  const where: any = {
    and: [{ status: { equals: 'completed' } }],
  }

  if (from || to) {
    const dateClause: any = {}
    if (from) dateClause.greater_than_equal = new Date(from + 'T00:00:00').toISOString()
    if (to) dateClause.less_than_equal = new Date(to + 'T23:59:59').toISOString()
    where.and.push({ createdAt: dateClause })
  }

  if (collectorIds.length > 0) {
    where.and.push({ collectedBy: { in: collectorIds } })
  }

  // Fetch payments
  const payments = await payload.find({
    collection: 'payments',
    where,
    limit: 100000,
    depth: 2,
    sort: '-createdAt',
  })

  // Build rows
  const rows: PaymentRow[] = []
  const clientIdsSeen = new Set<string>()
  const collectorIdsSeen = new Set<string>()

  for (const p of payments.docs as any[]) {
    const account = typeof p.account === 'object' ? p.account : null
    const client = account && typeof account.client === 'object' ? account.client : null
    const collector = typeof p.collectedBy === 'object' ? p.collectedBy : null

    // Filter by client if specified
    if (clientId && client?.id !== clientId) continue

    const amount = p.amount ?? 0
    const isameShare = Math.round(amount * 0.2 * 100) / 100
    const clientShare = Math.round(amount * 0.8 * 100) / 100

    const collectorName = collector?.name || 'Unknown'
    const clientName = client?.name || 'Unassigned'
    const accountNumber = account?.accountNumber || 'N/A'
    const debtorName = account?.debtorName || ''

    if (collector?.id) collectorIdsSeen.add(collector.id)
    if (client?.id) clientIdsSeen.add(client.id)

    rows.push({
      id: p.id,
      date: p.date ? new Date(p.date).toISOString().slice(0, 10) : null,
      createdAt: p.createdAt,
      collectorId: collector?.id ?? null,
      collectorName,
      accountId: account?.id ?? null,
      accountNumber,
      debtorName,
      clientId: client?.id ?? null,
      clientName,
      method: p.method || 'cash',
      amount,
      isameShare,
      clientShare,
      reference: p.reference || p.transactionId || '',
    })
  }

  // Count refunded payments in range (for the header note)
  const refundedWhere: any = {
    and: [{ status: { equals: 'refunded' } }],
  }
  if (from || to) {
    const dateClause: any = {}
    if (from) dateClause.greater_than_equal = new Date(from + 'T00:00:00').toISOString()
    if (to) dateClause.less_than_equal = new Date(to + 'T23:59:59').toISOString()
    refundedWhere.and.push({ createdAt: dateClause })
  }
  if (collectorIds.length > 0) {
    refundedWhere.and.push({ collectedBy: { in: collectorIds } })
  }

  const refunded = await payload.find({
    collection: 'payments',
    where: refundedWhere,
    limit: 10000,
    depth: 0,
  })

  const refundedCount = refunded.docs.length
  const refundedTotal = refunded.docs.reduce((s: number, p: any) => s + (p.amount ?? 0), 0)

  // Totals
  const grandTotal = rows.reduce((s, r) => s + r.amount, 0)
  const grandIsame = rows.reduce((s, r) => s + r.isameShare, 0)
  const grandClient = rows.reduce((s, r) => s + r.clientShare, 0)

  const filters = {
    from: from || null,
    to: to || null,
    collectorIds,
    clientId: clientId || null,
  }

  // CSV export
  if (format === 'csv') {
    const header = [
      'Date',
      'Collector',
      'Account #',
      'Debtor',
      'Client',
      'Method',
      'Payment',
      'ISAME (20%)',
      'Client (80%)',
      'Reference',
    ].join(',')

    const csvRows = rows.map((r) =>
      [
        r.date || '',
        csvEscape(r.collectorName),
        csvEscape(r.accountNumber),
        csvEscape(r.debtorName),
        csvEscape(r.clientName),
        csvEscape(r.method),
        r.amount.toFixed(2),
        r.isameShare.toFixed(2),
        r.clientShare.toFixed(2),
        csvEscape(r.reference),
      ].join(','),
    )

    const totals = [
      '',
      '',
      '',
      '',
      '',
      'TOTAL',
      grandTotal.toFixed(2),
      grandIsame.toFixed(2),
      grandClient.toFixed(2),
      '',
    ].join(',')

    const csv = [header, ...csvRows, totals].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="collector-collections-${from || 'all'}-to-${to || 'all'}.csv"`,
      },
    })
  }

  // JSON response
  return NextResponse.json({
    rows,
    totals: {
      count: rows.length,
      amount: Math.round(grandTotal * 100) / 100,
      isameShare: Math.round(grandIsame * 100) / 100,
      clientShare: Math.round(grandClient * 100) / 100,
    },
    refunded: {
      count: refundedCount,
      total: Math.round(refundedTotal * 100) / 100,
    },
    filters,
    clientIdsSeen: Array.from(clientIdsSeen),
    collectorIdsSeen: Array.from(collectorIdsSeen),
  })
}

function csvEscape(value: string): string {
  if (!value) return ''
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
