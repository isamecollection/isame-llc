'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { ConfirmModal } from '@/components/crm/ConfirmModal'

export function TriggerCourtCharges({
  accountId,
  townCity,
}: {
  accountId: string
  townCity?: string
}) {
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const { showToast } = useToast()

  const isBelizeCity = (townCity || '').toLowerCase().includes('belize city')
  const summonsAmount = isBelizeCity ? 25 : 50
  const courtCharge = 4
  const totalCharges = summonsAmount + courtCharge

  const handleTrigger = async () => {
    setSubmitting(true)
    try {
      // Fetch current account to get financials
      const accountRes = await fetch(`/api/accounts/${accountId}?depth=0`, {
        credentials: 'include',
      })
      const account = await accountRes.json()

      const initial = account.initialAccount || account.originalBalance || 0
      const fee = account.fee20Percent || 0
      const paid = account.paymentsReceived || 0
      const currentTotal = account.totalCollectable || 0

      // Only add if charges aren't already applied
      if ((account.summonsAmount || 0) > 0 || (account.courtCharge || 0) > 0) {
        showToast('Court charges already applied to this account', 'error')
        setSubmitting(false)
        setShowModal(false)
        return
      }

      const newTotal = currentTotal + totalCharges
      const newBalance = Math.max(0, newTotal - paid)

      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summonsAmount,
          courtCharge,
          totalCollectable: Math.round(newTotal * 100) / 100,
          currentBalance: Math.round(newBalance * 100) / 100,
          status: 'legal',
          legalStatus: 'in_court',
        }),
      })

      if (res.ok) {
        showToast(`Court charges applied: $${summonsAmount} summons + $${courtCharge} court fee`)
        window.location.reload()
      } else {
        showToast('Failed to apply charges', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
    setSubmitting(false)
    setShowModal(false)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={submitting}
        className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
      >
        {submitting ? 'Applying...' : '⚖️ Apply Court Charges'}
      </button>

      <ConfirmModal
        open={showModal}
        title="Apply Court Charges"
        message={`This will add court charges to this account and move it to legal status.\n\nSummons: $${summonsAmount} (${isBelizeCity ? 'Belize City' : 'Outside Belize City'})\nCourt Fee: $${courtCharge}\nTotal Charges: $${totalCharges}\n\nThe Process Server will need to serve the summons.`}
        confirmLabel={`Apply $${totalCharges} in Charges`}
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleTrigger}
        onCancel={() => setShowModal(false)}
      />
    </>
  )
}
