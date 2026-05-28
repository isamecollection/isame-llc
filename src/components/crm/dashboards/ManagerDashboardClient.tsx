'use client'
import { useState, useEffect } from 'react'

type ClientStats = {
  totalAccounts: number
  totalOutstanding: number
  totalCollected: number
  brokenCount: number
  activeWithPayments: number
}

export default function ManagerDashboardClient({ clients }: { clients: any[] }) {
  const [selectedClientId, setSelectedClientId] = useState(
    clients.length > 0 ? clients[0].id : ''
  )
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async (clientId: string) => {
    setLoading(true)
    const res = await fetch(`/api/manager/client-stats?clientId=${clientId}`)
    const data = await res.json()
    setStats(data)
    setLoading(false)
  }

  useEffect(() => {
    if (selectedClientId) {
      fetchStats(selectedClientId)
    }
  }, [])

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value
    setSelectedClientId(clientId)
    if (clientId) {
      fetchStats(clientId)
    } else {
      setStats(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <select
          value={selectedClientId}
          onChange={handleClientChange}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          {clients.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.prefix})
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-500">Loading stats…</p>}

      {stats && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Accounts" value={stats.totalAccounts} />
          <StatCard title="Outstanding" value={stats.totalOutstanding} isCurrency />
          <StatCard title="Collected" value={stats.totalCollected} isCurrency />
          <StatCard title="Broken Promises" value={stats.brokenCount} highlight />
          <StatCard title="Active with Payments" value={stats.activeWithPayments} />
        </div>
      )}

      {!stats && !loading && (
        <p className="text-gray-500 dark:text-gray-400">No stats available.</p>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  isCurrency,
  highlight,
}: {
  title: string
  value: number
  isCurrency?: boolean
  highlight?: boolean
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-red-600' : ''}`}>
        {isCurrency ? '$' : ''}
        {value.toLocaleString()}
      </p>
    </div>
  )
}
