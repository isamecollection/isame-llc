'use client'
import { useState, useEffect, useCallback } from 'react'
import { StatCard } from '@/components/crm/StatCard'
import { Skeleton } from '@/components/crm/Skeleton'

type ClientStats = {
  totalAccounts: number
  totalCollectable: number
  totalOutstanding: number
  totalCollected: number
  brokenCount: number
  activeWithPayments: number
}

export default function ManagerDashboardClient({ clients }: { clients: any[] }) {
  const [selectedClientId, setSelectedClientId] = useState(clients.length > 0 ? clients[0].id : '')
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = useCallback(async (clientId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/manager/client-stats?clientId=${clientId}`)
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (selectedClientId) {
      fetchStats(selectedClientId)
    }
  }, [selectedClientId, fetchStats])

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

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2"
            >
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {stats && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Accounts" value={stats.totalAccounts} />
          <StatCard title="Total Collectable" value={stats.totalCollectable} isCurrency />
          <StatCard title="Outstanding" value={stats.totalOutstanding} isCurrency />
          <StatCard title="Collected" value={stats.totalCollected} isCurrency variant="success" />
          <StatCard
            title="Broken Promises"
            value={stats.brokenCount}
            variant={stats.brokenCount > 0 ? 'urgent' : 'default'}
          />
          <StatCard title="Active with Payments" value={stats.activeWithPayments} />
        </div>
      )}

      {!stats && !loading && (
        <p className="text-gray-500 dark:text-gray-400">Select a client to view stats.</p>
      )}
    </div>
  )
}
