'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function AssignProcessServer({
  accountId,
  processServers,
}: {
  accountId: string
  processServers: any[]
}) {
  const [selectedId, setSelectedId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const handleAssign = async () => {
    if (!selectedId) {
      showToast('Select a process server', 'error')
      return
    }
    setSubmitting(true)
    const res = await fetch(`/api/accounts/${accountId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedProcessServer: selectedId, serviceStatus: 'pending_service' }),
    })
    if (res.ok) {
      showToast('Process server assigned!')
      window.location.reload()
    } else {
      showToast('Failed to assign', 'error')
    }
    setSubmitting(false)
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
      >
        <option value="">Select Process Server...</option>
        {processServers.map((ps: any) => (
          <option key={ps.id} value={ps.id}>
            {ps.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        disabled={submitting || !selectedId}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
      >
        {submitting ? '...' : 'Assign'}
      </button>
    </div>
  )
}
