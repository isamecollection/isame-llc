'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function AssignDropdown({
  accountId,
  currentValue,
  agents,
  field,
  statusAfter,
}: {
  accountId: string
  currentValue?: string
  agents: any[]
  field: string
  statusAfter: string
}) {
  const [selectedId, setSelectedId] = useState(currentValue || '')
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value
    setSelectedId(newId)
    setSubmitting(true)
    const body: any = { [field]: newId || null }
    if (field === 'assignedCourtAgent') body.legalStatus = newId ? 'assigned' : 'pending_review'
    if (field === 'assignedProcessServer')
      body.serviceStatus = newId ? 'pending_service' : 'not_assigned'
    const res = await fetch(`/api/accounts/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      showToast('Assigned successfully')
    } else {
      showToast('Failed to assign', 'error')
      setSelectedId(currentValue || '')
    }
    setSubmitting(false)
  }

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      disabled={submitting}
      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm"
    >
      <option value="">Unassigned</option>
      {agents.map((a: any) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  )
}
