'use client'
import { useState, useEffect } from 'react'

export function IndividualClientReport() {
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clients?sort=name&limit=200')
      .then((r) => r.json())
      .then((d) => {
        setClients(d.docs || [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          <option value="">-- select a client --</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.prefix})
            </option>
          ))}
        </select>

        {selectedClientId && (
          <a
            href={`/api/client-report?clientId=${selectedClientId}`}
            target="_blank"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            📄 Download PDF
          </a>
        )}
      </div>

      {selectedClientId && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Select a client above and click Download PDF to generate their branded report.
        </p>
      )}
    </div>
  )
}
