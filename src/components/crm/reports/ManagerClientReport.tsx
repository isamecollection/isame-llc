'use client'
import { useState, useEffect } from 'react'

export function ManagerClientReport() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/manager-report-data')
      .then((r) => r.json())
      .then((json) => {
        setData(json.rows || [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <div className="mb-4">
        <a
          href="/api/manager-report"
          target="_blank"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          📄 Download PDF Report
        </a>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading preview…</p>
      ) : data.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No data available.</p>
      ) : (
        <div className="max-h-125 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Accounts</th>
                <th className="px-4 py-3 font-semibold">Total Collectable</th>
                <th className="px-4 py-3 font-semibold">Collected</th>
                <th className="px-4 py-3 font-semibold">Outstanding</th>
                <th className="px-4 py-3 font-semibold">Isame Fee (20%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((row: any, idx: number) => (
                <tr
                  key={idx}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3">{row.client}</td>
                  <td className="px-4 py-3">{row.accounts}</td>
                  <td className="px-4 py-3">{row.totalCollectable}</td>
                  <td className="px-4 py-3">{row.collected}</td>
                  <td className="px-4 py-3">{row.outstanding}</td>
                  <td className="px-4 py-3">{row.charge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
