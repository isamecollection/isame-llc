'use client'
import { useState, useEffect } from 'react'

export function ScheduledPaymentsSection({ accountId }: { accountId: string }) {
  const [scheduled, setScheduled] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchScheduled() {
    setLoading(true)
    const res = await fetch(
      `/api/scheduled-payments?where[account][equals]=${accountId}&sort=dueDate&limit=50`,
    )
    const data = await res.json()
    setScheduled(data.docs || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchScheduled()
  }, [accountId])

  async function handleDelete(id: string) {
    if (!confirm('Delete this scheduled payment?')) return
    const res = await fetch(`/api/scheduled-payments/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setScheduled((prev) => prev.filter((s) => s.id !== id))
    } else {
      alert('Failed to delete. You may not have permission.')
    }
  }

  if (loading) return <p className="text-gray-500">Loading scheduled payments…</p>
  if (scheduled.length === 0)
    return <p className="text-gray-500 dark:text-gray-400">No scheduled payments.</p>

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {scheduled.map((s: any) => (
        <li key={s.id} className="py-2 flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              ${s.amount?.toLocaleString()}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              due {new Date(s.dueDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                s.status === 'paid'
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : s.status === 'missed'
                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
              }`}
            >
              {s.status}
            </span>
            <button
              onClick={() => handleDelete(s.id)}
              className="text-red-600 dark:text-red-400 hover:underline text-sm"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
