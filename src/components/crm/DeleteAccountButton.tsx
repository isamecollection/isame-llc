'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteAccountButton({ accountId }: { accountId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setSubmitting(true)
    const res = await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/crm/accounts') // redirect after deletion
    } else {
      alert('Failed to delete account. You may not have permission.')
    }
    setSubmitting(false)
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Delete Account
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Are you sure?</span>
      <button
        onClick={handleDelete}
        disabled={submitting}
        className="px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800 disabled:opacity-50"
      >
        {submitting ? 'Deleting…' : 'Confirm Delete'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
      >
        Cancel
      </button>
    </div>
  )
}
