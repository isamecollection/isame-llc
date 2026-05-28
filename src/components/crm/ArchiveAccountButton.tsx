'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function ArchiveAccountButton({
  accountId,
  archived,
}: {
  accountId: string
  archived: boolean
}) {
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const toggleArchive = async () => {
    if (!confirm(archived ? 'Un‑archive this account?' : 'Archive this account?')) return
    setSubmitting(true)
    const res = await fetch(`/api/accounts/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !archived }),
    })
    if (res.ok) {
      showToast(archived ? 'Account un‑archived' : 'Account archived')
      window.location.reload()
    } else {
      showToast('Failed to update archive status', 'error')
    }
    setSubmitting(false)
  }

  return (
    <button
      onClick={toggleArchive}
      disabled={submitting}
      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
    >
      {submitting ? 'Updating…' : archived ? 'Un‑archive' : 'Archive'}
    </button>
  )
}
