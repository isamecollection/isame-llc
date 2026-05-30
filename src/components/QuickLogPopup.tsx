'use client'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'

export function QuickLogPopup() {
  const [pending, setPending] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [outcome, setOutcome] = useState('no_answer')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    const handleFocus = () => {
      const raw = sessionStorage.getItem('pendingLog')
      if (raw) {
        try {
          const data = JSON.parse(raw)
          setPending(data)
          setShow(true)
          sessionStorage.removeItem('pendingLog')
        } catch {}
      }
    }

    window.addEventListener('focus', handleFocus)
    handleFocus()
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const handleSave = async () => {
    if (!pending) return
    setSubmitting(true)
    const { accountId, phoneNumber, type } = pending

    await fetch('/api/call-attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: accountId,
        contactType: 'debtor',
        phoneNumber,
        outcome,
        notes: `${type === 'call' ? '📞 Call' : type === 'sms' ? '💬 SMS' : '📱 WhatsApp'} to ${phoneNumber} – ${notes}`,
        callDate: new Date().toISOString(),
      }),
    })

    showToast(`${type === 'call' ? 'Call' : type === 'sms' ? 'SMS' : 'WhatsApp'} logged`)
    setShow(false)
    setNotes('')
    setOutcome('no_answer')
    setSubmitting(false)
  }

  if (!show || !pending) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 w-80">
      <h4 className="font-semibold mb-2">
        Log {pending.type === 'call' ? 'Call' : pending.type === 'sms' ? 'SMS' : 'WhatsApp'}
      </h4>
      <p className="text-sm text-gray-500 mb-3">To: {pending.phoneNumber}</p>
      <select
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg mb-2 dark:bg-gray-900 dark:border-gray-600 text-sm"
      >
        <option value="no_answer">No Answer</option>
        <option value="voicemail">Voicemail</option>
        <option value="right_party_contact">Right Party Contact</option>
        <option value="wrong_number">Wrong Number</option>
        <option value="disconnected">Disconnected</option>
        <option value="callback_requested">Callback Requested</option>
        <option value="other">Other</option>
      </select>
      <textarea
        rows={2}
        placeholder="Notes…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg mb-2 dark:bg-gray-900 dark:border-gray-600 text-sm"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShow(false)}
          className="px-3 py-1 text-sm text-gray-500 hover:underline"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
