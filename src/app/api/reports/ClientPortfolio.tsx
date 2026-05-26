'use client'
import { useState, useEffect } from 'react'

export function ClientPortfolio() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    const res = await fetch('/api/reports/client-portfolio')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="max-h-125 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Accounts</th>
                <th className="px-4 py-3 font-semibold">Outstanding</th>
                <th className="px-4 py-3 font-semibold">Collected</th>
                <th className="px-4 py-3 font-semibold">Active Agreements</th>
                <th className="px-4 py-3 font-semibold">Legal Cases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((d: any) => (
                <tr
                  key={d.id}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3">
                    {d.name} ({d.prefix})
                  </td>
                  <td className="px-4 py-3">{d.accountCount}</td>
                  <td className="px-4 py-3">${d.totalOutstanding.toLocaleString()}</td>
                  <td className="px-4 py-3">${d.totalCollected.toLocaleString()}</td>
                  <td className="px-4 py-3">{d.activeAgreements}</td>
                  <td className="px-4 py-3">{d.legalCases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
