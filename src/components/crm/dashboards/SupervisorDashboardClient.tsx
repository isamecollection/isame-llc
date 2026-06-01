'use client'
import { useState } from 'react'
import { StatCard } from '@/components/crm/StatCard'
import { Skeleton } from '@/components/crm/Skeleton'
import { EmptyState } from '@/components/crm/EmptyState'

type AgentStats = {
  totalAccounts: number
  totalOutstanding: number
  totalCollected: number
  brokenPromisesCount: number
  futurePromisesTotal: number
}

export default function SupervisorDashboardClient({
  team,
  recentActivity,
}: {
  team: any[]
  recentActivity: any[]
}) {
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
    try {
      const res = await fetch(`/api/supervisor/agent-stats?agentId=${agentId}`)
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch agent stats:', error)
    }
    setLoading(false)
  }

  const actionLabels: Record<string, string> = {
    view: '👁️ viewed',
    create: '➕ created',
    update: '✏️ updated',
    delete: '🗑️ deleted',
    assign: '👤 assigned',
    export: '📥 exported',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Stats */}
      <div className="lg:col-span-2">
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

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
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
            <StatCard title="Total Outstanding" value={stats.totalOutstanding} isCurrency />
            <StatCard
              title="Total Collected"
              value={stats.totalCollected}
              isCurrency
              variant="success"
            />
            <StatCard
              title="Broken Promises"
              value={stats.brokenPromisesCount}
              variant={stats.brokenPromisesCount > 0 ? 'urgent' : 'default'}
            />
            <StatCard title="Future Promises" value={stats.futurePromisesTotal} isCurrency />
          </div>
        )}

        {!stats && !loading && selectedAgentId && (
          <EmptyState
            icon="📊"
            title="No stats available"
            description="Select an agent above to view their performance."
          />
        )}

        {!selectedAgentId && (
          <EmptyState
            icon="👥"
            title="Select an agent"
            description="Choose a team member to view their stats."
          />
        )}
      </div>

      {/* Right: Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-3">📋 Recent Team Activity</h2>
        {recentActivity.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No activity yet"
            description="Team activity will appear here."
          />
        ) : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {recentActivity.map((log: any) => (
              <div
                key={log.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {log.user?.name || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {actionLabels[log.action] || log.action}{' '}
                  <span className="font-medium">{log.documentName || log.collection}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(log.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
