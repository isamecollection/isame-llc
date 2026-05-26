'use client'
import { useState, useEffect } from 'react'

export function CollectorProductivity() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('thisMonth') // thisMonth, lastMonth, all

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (range === 'thisMonth') {
      const now = new Date()
      params.append('start', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
      params.append(
        'end',
        new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
      )
    } else if (range === 'lastMonth') {
      const now = new Date()
      params.append('start', new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString())
      params.append('end', new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString())
    }
    // 'all' sends no params

    const res = await fetch(`/api/reports/collector-productivity?${params.toString()}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [range])

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
        >
          <option value="thisMonth">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="max-h-125 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Collector</th>
                <th className="px-4 py-3 font-semibold">Calls</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
                <th className="px-4 py-3 font-semibold">Agreements</th>
                <th className="px-4 py-3 font-semibold">Collected</th>
                <th className="px-4 py-3 font-semibold">Broken Promises</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((d: any) => (
                <tr
                  key={d.id}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3">{d.calls}</td>
                  <td className="px-4 py-3">{d.notes}</td>
                  <td className="px-4 py-3">{d.agreementsCreated}</td>
                  <td className="px-4 py-3">${d.totalCollected.toLocaleString()}</td>
                  <td className="px-4 py-3">{d.promisesBroken}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
