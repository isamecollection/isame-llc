'use client'
import { useState } from 'react'

export function ImportForm({ clients }: { clients: any[] }) {
  const [clientId, setClientId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId || !file) return
    setSubmitting(true)
    setMessage('')

    const reader = new FileReader()
    reader.onload = async (event) => {
      const csv = event.target?.result as string
      try {
        const res = await fetch('/api/import-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csv, clientId }),
        })
        const json = await res.json()
        setMessage(json.message || 'Import completed')
      } catch (err) {
        setMessage('Import failed')
      }
      setSubmitting(false)
    }
    reader.readAsText(file)
  }

  return (
    <form
      onSubmit={handleUpload}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-5"
    >
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

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {submitting ? 'Importing…' : 'Upload & Import'}
      </button>

      {message && (
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300">
          {message}
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
