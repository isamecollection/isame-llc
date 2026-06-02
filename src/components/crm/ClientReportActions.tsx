'use client'

export function ClientReportActions({ clientId, accounts }: { clientId: string; accounts: any[] }) {
  const handleExportCSV = () => {
    const headers = [
      'Debtor Name',
      'Account #',
      'Balance',
      'Total Collectable',
      'Paid',
      'Status',
      'Legal Status',
    ]
    const rows = accounts.map((a: any) => [
      a.debtorName || '',
      a.accountNumber || '',
      a.currentBalance || 0,
      a.totalCollectable || 0,
      a.paymentsReceived || 0,
      a.status || '',
      a.legalStatus || '',
    ])

    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `client-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportCSV}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
      >
        📥 Download CSV
      </button>
      <a
        href={`/api/client-report?clientId=${clientId}`}
        target="_blank"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
      >
        📄 Export PDF
      </a>
    </div>
  )
}
