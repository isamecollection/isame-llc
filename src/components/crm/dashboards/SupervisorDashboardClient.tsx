'use client'
import { useState, useMemo } from 'react'
import { StatCard } from '@/components/crm/StatCard'
import { Skeleton } from '@/components/crm/Skeleton'
import { EmptyState } from '@/components/crm/EmptyState'

type AgentStats = {
  totalAccounts: number
  totalOutstanding: number
  totalCollected: number
  activeAgreements: number // ← ADD THIS
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

  // Filter activity by selected agent, or show all
  const filteredActivity = useMemo(() => {
    if (!selectedAgentId) return recentActivity
    return recentActivity.filter((log: any) => {
      const userId = typeof log.user === 'object' ? log.user?.id : log.user
      return userId === selectedAgentId
    })
  }, [recentActivity, selectedAgentId])

  return (
    <div className="space-y-6">
      {/* Agent Selector & Stats */}
      <div>
        <div className="mb-4">
          <select
            value={selectedAgentId}
            onChange={handleAgentChange}
            className="w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          >
            <option value="">-- all agents --</option>
            {team.map((member: any) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <StatCard title="Active Agreements" value={stats.activeAgreements} />
          </div>
        )}

        {!stats && !loading && selectedAgentId && (
          <EmptyState icon="📊" title="No stats available" />
        )}

        {!selectedAgentId && (
          <EmptyState
            icon="👥"
            title="Select an agent"
            description="Choose a team member to view their performance."
          />
        )}
      </div>

      {/* Recent Activity - Full Width, Filtered */}
      <div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              📋 {selectedAgentId ? 'Agent Activity' : 'Recent Team Activity'}
            </h2>
            <span className="text-xs text-gray-400">{filteredActivity.length} entries</span>
          </div>
          {filteredActivity.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon="📭"
                title="No activity yet"
                description="Activity will appear here as your team works."
              />
            </div>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Collector</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Account/Document</th>
                    <th className="px-4 py-3 font-semibold">Collection</th>
                    <th className="px-4 py-3 font-semibold text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredActivity.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                          {log.user?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            log.action === 'view'
                              ? 'bg-blue-100 text-blue-700'
                              : log.action === 'create'
                                ? 'bg-green-100 text-green-700'
                                : log.action === 'update'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : log.action === 'delete'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {log.documentName || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{log.collection}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap text-right">
                        {new Date(log.timestamp).toLocaleDateString()}{' '}
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
