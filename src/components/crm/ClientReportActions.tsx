'use client'

import { useState } from 'react'

export function ClientReportActions({ accounts }: { accounts: any[] }) {
  const [downloading, setDownloading] = useState(false)

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

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const response = await fetch('/api/reports/client-pdf')
      if (!response.ok) throw new Error('Failed to generate PDF')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'portfolio-report.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Could not download the report. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportCSV}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
      >
        📥 Download CSV
      </button>
      <button
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
      >
        {downloading ? '⏳ Generating…' : '📄 Export PDF'}
      </button>
    </div>
  )
}
