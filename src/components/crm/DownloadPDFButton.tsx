// src/components/crm/DownloadPDFButton.tsx
'use client'

export function DownloadPDFButton() {
  return (
    <button
      onClick={() => window.open('/api/reports/client-pdf', '_blank')}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
    >
      📥 Download PDF Report
    </button>
  )
}
