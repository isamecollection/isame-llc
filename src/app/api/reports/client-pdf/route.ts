// src/app/api/reports/client-pdf/route.ts
import { getPayload } from '@/payload'
import { headers, cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import { getHighestRole } from '@/lib/permissions'

export async function GET() {
  const payload = await getPayload()
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cookieStore = await cookies()
  const roles: string[] = user.roles ?? []
  const activeRoleCookie = cookieStore.get('activeRole')?.value
  const activeRole =
    activeRoleCookie && roles.includes(activeRoleCookie) ? activeRoleCookie : getHighestRole(roles)

  // Only clients can access this report
  if (activeRole !== 'client') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get the linked client ID from the user’s clientProfile
  const userDoc = await payload.findByID({ collection: 'users', id: user.id })
  const clientId =
    typeof userDoc.clientProfile === 'string'
      ? userDoc.clientProfile
      : (userDoc.clientProfile as any)?.id

  if (!clientId) {
    return NextResponse.json({ error: 'No client profile linked' }, { status: 400 })
  }

  const client = await payload.findByID({ collection: 'clients', id: clientId })

  // Fetch all accounts belonging to the client
  const { docs: accounts } = await payload.find({
    collection: 'accounts',
    where: { client: { equals: clientId } },
    depth: 0,
    sort: '-currentBalance',
    limit: 9999,
  })

  const accountIds = accounts.map((a) => a.id)

  // Fetch completed payments and legal cases for these accounts
  const [paymentsRes, legalCasesRes] = await Promise.all([
    payload.find({
      collection: 'payments',
      where: { status: { equals: 'completed' }, account: { in: accountIds } },
      limit: 9999,
    }),
    payload.find({
      collection: 'legal-cases',
      where: { account: { in: accountIds } },
      limit: 9999,
    }),
  ])

  const payments = paymentsRes.docs
  const legalCases = legalCasesRes.docs

  // ── Compute Summary Statistics ──
  const totalOutstanding = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0)
  const totalCollected = accounts.reduce((sum, a) => sum + (a.paymentsReceived || 0), 0)
  const totalCollectable = accounts.reduce((sum, a) => sum + (a.totalCollectable || 0), 0)

  const activeAccounts = accounts.filter((a) => a.status === 'active').length
  const legalAccounts = accounts.filter((a) => a.status === 'legal').length
  const settledAccounts = accounts.filter((a) => a.status === 'settled').length
  const paidAccounts = accounts.filter((a) => a.status === 'paid').length
  const pendingAccounts = activeAccounts + legalAccounts // accounts not yet settled/paid

  const collectionRate = totalCollectable > 0 ? (totalCollected / totalCollectable) * 100 : 0
  const activeLegalCases = legalCases.filter((c) => c.status !== 'closed').length

  // ── Monthly Collections (Current Year) ──
  const now = new Date()
  const currentYear = now.getFullYear()
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const monthlyCollected = months.map((_, idx) => {
    const start = new Date(currentYear, idx, 1).toISOString()
    const end = new Date(currentYear, idx + 1, 0, 23, 59, 59).toISOString()
    const monthPayments = payments.filter((p) => {
      const d = p.date || p.createdAt
      return d >= start && d <= end
    })
    return monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  })

  // ── Recent Payments (last 10) ──
  const recentPayments = [...payments]
    .sort(
      (a, b) =>
        new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime(),
    )
    .slice(0, 10)

  // ══════════════════════════════════════════
  //  GENERATE PDF
  // ══════════════════════════════════════════
  const doc = new jsPDF()
  let y = 20

  // Header
  doc.setFontSize(16)
  doc.text(`Portfolio Report – ${client.name}`, 105, y, { align: 'center' })
  y += 10
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, y, { align: 'center' })
  y += 12

  // ── Summary Box ──
  doc.setFontSize(12)
  doc.text('Summary', 14, y)
  y += 8
  doc.setFontSize(10)
  const summaryLines = [
    `Total Outstanding: $${totalOutstanding.toLocaleString()}`,
    `Total Collected: $${totalCollected.toLocaleString()}`,
    `Collection Rate: ${collectionRate.toFixed(1)}%`,
    `Pending Accounts (Active + Legal): ${pendingAccounts}`,
    `Active Legal Cases: ${activeLegalCases}`,
    `Status Breakdown – Active: ${activeAccounts} | Legal: ${legalAccounts} | Settled: ${settledAccounts} | Paid: ${paidAccounts}`,
  ]
  summaryLines.forEach((line) => {
    doc.text(line, 14, y)
    y += 6
  })

  y += 6
  // ── Monthly Collections Table ──
  doc.setFontSize(12)
  doc.text('Monthly Collections', 14, y)
  y += 8
  doc.setFontSize(9)
  const colX = [14, 60, 100, 140]
  doc.text('Month', colX[0], y)
  doc.text('Collected', colX[1], y)
  doc.text('Rate', colX[2], y)
  doc.text('Cumulative', colX[3], y)
  y += 5
  doc.line(14, y, 196, y)
  y += 4

  let cumulative = 0
  months.forEach((month, idx) => {
    if (y > 270) {
      doc.addPage()
      y = 20
      doc.line(14, y, 196, y)
      y += 4
    }
    const amount = monthlyCollected[idx]
    cumulative += amount
    const monthRate = totalCollectable > 0 ? (amount / totalCollectable) * 100 : 0
    doc.text(month, colX[0], y)
    doc.text(`$${amount.toLocaleString()}`, colX[1], y)
    doc.text(`${monthRate.toFixed(1)}%`, colX[2], y)
    doc.text(`$${cumulative.toLocaleString()}`, colX[3], y)
    y += 5
  })

  y += 8
  // ── Accounts Detail ──
  doc.setFontSize(12)
  doc.text('Accounts', 14, y)
  y += 7
  doc.setFontSize(8)
  const acctCols = [14, 60, 105, 140, 170]
  doc.text('Debtor Name', acctCols[0], y)
  doc.text('Account #', acctCols[1], y)
  doc.text('Balance', acctCols[2], y)
  doc.text('Paid', acctCols[3], y)
  doc.text('Status', acctCols[4], y)
  y += 4
  doc.line(14, y, 196, y)
  y += 4

  accounts.forEach((acc) => {
    if (y > 270) {
      doc.addPage()
      y = 20
      doc.line(14, y, 196, y)
      y += 4
    }
    doc.text((acc.debtorName || '').substring(0, 20), acctCols[0], y)
    doc.text(acc.accountNumber || '', acctCols[1], y)
    doc.text(`$${(acc.currentBalance || 0).toLocaleString()}`, acctCols[2], y)
    doc.text(`$${(acc.paymentsReceived || 0).toLocaleString()}`, acctCols[3], y)
    doc.text(acc.status || '', acctCols[4], y)
    y += 5
  })

  // ── Recent Payments (if any) ──
  if (recentPayments.length > 0) {
    y += 8
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    doc.setFontSize(12)
    doc.text('Recent Payments', 14, y)
    y += 7
    doc.setFontSize(8)
    const payCols = [14, 50, 100, 140]
    doc.text('Date', payCols[0], y)
    doc.text('Account', payCols[1], y)
    doc.text('Amount', payCols[2], y)
    doc.text('Method', payCols[3], y)
    y += 4
    doc.line(14, y, 196, y)
    y += 4
    recentPayments.forEach((p) => {
      if (y > 270) {
        doc.addPage()
        y = 20
        doc.line(14, y, 196, y)
        y += 4
      }
      doc.text(new Date(p.date || p.createdAt).toLocaleDateString(), payCols[0], y)
      doc.text((p.account as any)?.debtorName?.substring(0, 18) || '—', payCols[1], y)
      doc.text(`$${(p.amount || 0).toLocaleString()}`, payCols[2], y)
      doc.text(p.method || '—', payCols[3], y)
      y += 5
    })
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="portfolio-report-${client.name.replace(/\s+/g, '_')}.pdf"`,
    },
  })
}
