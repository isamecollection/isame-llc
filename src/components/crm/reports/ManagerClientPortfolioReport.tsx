'use client'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'

export function ManagerClientPortfolioReport() {
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [downloading, setDownloading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    fetch('/api/clients?sort=name&limit=200', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setClients(data.docs || []))
      .catch(() => showToast('Failed to load clients', 'error'))
  }, [showToast])

  const handleDownload = async () => {
    if (!selectedClientId) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/reports/client-pdf?clientId=${selectedClientId}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        showToast(err.error || 'Download failed', 'error')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // 👇 Use the selected client's name (sanitised)
      const client = clients.find((c: any) => c.id === selectedClientId)
      const clientName = client?.name || 'portfolio'
      const safeName = clientName.replace(/[^a-z0-9\-_ ]/gi, '').replace(/\s+/g, '_')
      a.download = `portfolio-report-${safeName}.pdf`

      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      showToast('Report downloaded', 'success')
    } catch (err) {
      showToast('Network error', 'error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Client Portfolio Report</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Select a client to download their full portfolio report (PDF) including summary, accounts,
          payments, and legal status.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Client / Portfolio
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">-- Select a client --</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleDownload}
            disabled={!selectedClientId || downloading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {downloading ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
