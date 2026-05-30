'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function SendToLegalButton({ accountId }: { accountId: string }) {
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const handleSendToLegal = async () => {
    if (!confirm('Send this account to legal review? A claims officer will review the case.'))
      return
    setSubmitting(true)
    const res = await fetch(`/api/accounts/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legalStatus: 'pending_review', status: 'legal' }),
    })
    if (res.ok) {
      showToast('Account sent to legal review')
      window.location.reload()
    } else {
      showToast('Failed to send to legal', 'error')
    }
    setSubmitting(false)
  }

  return (
    <button
      onClick={handleSendToLegal}
      disabled={submitting}
      className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
    >
      {submitting ? 'Sending…' : 'Send to Legal'}
    </button>
  )
}
