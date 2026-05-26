'use client'
import { useState, useEffect } from 'react'

export function AgreementsSection({ accountId }: { accountId: string }) {
  const [agreements, setAgreements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchAgreements() {
    setLoading(true)
    const res = await fetch(
      `/api/agreements?where[account][equals]=${accountId}&sort=-createdAt&limit=50`,
    )
    const data = await res.json()
    setAgreements(data.docs || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchAgreements()
  }, [accountId])

  async function handleDelete(agreementId: string) {
    if (!confirm('Delete this agreement?')) return
    const res = await fetch(`/api/agreements/${agreementId}`, { method: 'DELETE' })
    if (res.ok) {
      // Remove it from the local state
      setAgreements((prev) => prev.filter((a) => a.id !== agreementId))
    } else {
      alert('Failed to delete agreement. You may not have permission.')
    }
  }

  if (loading) return <p className="text-gray-500">Loading agreements…</p>
  if (agreements.length === 0)
    return <p className="text-gray-500 dark:text-gray-400">No agreements yet.</p>

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {agreements.map((a: any) => (
        <li key={a.id} className="py-3 flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {a.type?.replace('_', ' ')}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">– {a.status}</span>
          </div>
          <div className="flex items-center gap-3">
            {a.totalAmount && (
              <span className="text-sm font-semibold">${a.totalAmount.toLocaleString()}</span>
            )}
            <button
              onClick={() => handleDelete(a.id)}
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
