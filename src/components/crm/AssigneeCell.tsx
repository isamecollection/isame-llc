'use client'
import { useState } from 'react'

export function AssigneeCell({
  accountId,
  currentCollectorId,
  collectors,
}: {
  accountId: string
  currentCollectorId: string
  collectors: any[]
}) {
  const [selectedId, setSelectedId] = useState(currentCollectorId || '')
  const [submitting, setSubmitting] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newId = e.target.value
    setSelectedId(newId)
    setSubmitting(true)
    const res = await fetch(`/api/accounts/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedCollector: newId || null }),
    })
    if (!res.ok) {
      alert('Failed to update assignment')
      setSelectedId(currentCollectorId)
    }
    setSubmitting(false)
  }

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      disabled={submitting}
      className={`w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm ${submitting ? 'opacity-50' : ''}`}
    >
      <option value="">Unassigned</option>
      {collectors.map((c: any) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
