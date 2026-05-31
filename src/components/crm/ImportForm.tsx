'use client'
import { useState } from 'react'

export function ImportForm({ clients }: { clients: any[] }) {
  const [clientId, setClientId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [result, setResult] = useState('')

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !file) return
    setSubmitting(true)
    setResult('')
    setProgress({ current: 0, total: 0 })

    const text = await file.text()
    const lines = text.trim().split('\n')
    const header = lines[0]
    const rows = lines.slice(1)
    const totalRows = rows.length

    setProgress({ current: 0, total: totalRows })

    const BATCH_SIZE = 10
    let totalCreated = 0
    let totalUpdated = 0
    const allErrors: string[] = []

    for (let i = 0; i < totalRows; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const csv = [header, ...batch].join('\n')

      try {
        const res = await fetch('/api/import-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csv, clientId }),
        })
        const json = await res.json()

        totalCreated += json.created || 0
        totalUpdated += json.updated || 0
        if (json.errors) {
          allErrors.push(...json.errors)
        }
      } catch (err) {
        allErrors.push(`Batch ${i / BATCH_SIZE + 1}: Network error`)
      }

      setProgress({ current: Math.min(i + BATCH_SIZE, totalRows), total: totalRows })
    }

    setSubmitting(false)
    setProgress({ current: totalRows, total: totalRows })
    setResult(
      `Import complete. Created: ${totalCreated}, Updated: ${totalUpdated}, Errors: ${allErrors.length}`,
    )

    if (allErrors.length > 0) {
      console.log('Import errors:', allErrors)
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Select Client
        </label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- choose client --</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.prefix})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          CSV File
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
          className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
        />
      </div>

      {submitting && progress.total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Processing…</span>
            <span>
              {progress.current} / {progress.total} rows
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Importing…' : 'Upload & Import'}
      </button>

      {result && (
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300">
          {result}
        </div>
      )}

      <p className="text-sm text-center text-gray-500 dark:text-gray-400">
        <a
          href="/account_import_template.csv"
          download
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Download Template CSV
        </a>
      </p>
    </form>
  )
}
