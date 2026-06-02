'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function AssigneeCell({
  accountId,
  currentCollectorId,
  collectors,
}: {
  accountId: string
  currentCollectorId: string | { id: string; name: string }
  collectors: any[]
}) {
  const collectorId =
    typeof currentCollectorId === 'object' ? currentCollectorId?.id : currentCollectorId

  const [selectedId, setSelectedId] = useState(collectorId || '')
  const [originalId] = useState(collectorId || '')
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const hasChanged = selectedId !== originalId

  async function handleSave() {
    if (!hasChanged) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedCollector: selectedId || null }),
      })
      if (res.ok) {
        showToast('Assignment saved!')
      } else {
        showToast('Failed to save', 'error')
        setSelectedId(originalId)
      }
    } catch {
      showToast('Network error', 'error')
      setSelectedId(originalId)
    }
    setSubmitting(false)
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        disabled={submitting}
        className={`flex-1 px-2 py-1 border rounded bg-white dark:bg-gray-900 text-sm ${
          hasChanged ? 'border-yellow-400' : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        <option value="">Unassigned</option>
        {collectors.map((c: any) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {hasChanged && (
        <button
          onClick={handleSave}
          disabled={submitting}
          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? '...' : 'Save'}
        </button>
      )}
    </div>
  )
}
