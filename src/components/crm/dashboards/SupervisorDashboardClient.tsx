'use client'
import { useState } from 'react'

type AgentStats = {
  totalAccounts: number
  totalOutstanding: number
  totalCollected: number
  brokenPromisesCount: number
  futurePromisesTotal: number
}

export default function SupervisorDashboardClient({ team }: { team: any[] }) {
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAgentChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const agentId = e.target.value
    setSelectedAgentId(agentId)
    if (!agentId) {
      setStats(null)
      return
    }
    setLoading(true)
    const res = await fetch(`/api/supervisor/agent-stats?agentId=${agentId}`)
    const data = await res.json()
    setStats(data)
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-4">
        <select
          value={selectedAgentId}
          onChange={handleAgentChange}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
        >
          <option value="">-- select an agent --</option>
          {team.map((member: any) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-500">Loading stats…</p>}

      {stats && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Accounts" value={stats.totalAccounts} />
          <StatCard title="Total Outstanding" value={stats.totalOutstanding} isCurrency />
          <StatCard title="Total Collected" value={stats.totalCollected} isCurrency />
          <StatCard title="Broken Promises" value={stats.brokenPromisesCount} highlight />
          <StatCard title="Future Promises (Total)" value={stats.futurePromisesTotal} isCurrency />
        </div>
      )}

      {!stats && !loading && selectedAgentId && (
        <p className="text-gray-500">No stats available.</p>
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
