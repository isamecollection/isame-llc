'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function ArchiveClientButton({ clientId, archived }: { clientId: string; archived: boolean }) {
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const toggleArchive = async () => {
    if (!confirm(archived ? 'Un‑archive this client?' : 'Archive this client?')) return
    setSubmitting(true)
    const res = await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !archived }),
    })
    if (res.ok) {
      showToast(archived ? 'Client un‑archived' : 'Client archived')
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
      className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 disabled:opacity-50 transition-colors"
    >
      {submitting ? 'Updating…' : archived ? 'Un‑archive' : 'Archive'}
    </button>
  )
}
