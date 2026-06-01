'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { ConfirmModal } from '@/components/crm/ConfirmModal'

export function SendToLegalButton({ accountId }: { accountId: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [addCourtCharges, setAddCourtCharges] = useState(false)
  const { showToast } = useToast()

  const handleSendToLegal = async () => {
    setSubmitting(true)
    try {
      const body: any = {
        legalStatus: 'pending_review',
        status: 'legal',
      }

      // Add court charges if checked
      if (addCourtCharges) {
        // We need townCity to determine summons amount
        // Fetch account first to get location
        const accountRes = await fetch(`/api/accounts/${accountId}?depth=0`)
        const account = await accountRes.json()
        const townCity = account.townCity || ''
        const isBelizeCity = townCity.toLowerCase().includes('belize city')

        body.summonsAmount = isBelizeCity ? 25 : 50
        body.courtCharge = 4

        // Recalculate totals
        const initial = account.initialAccount || 0
        const fee = account.fee20Percent || 0
        const newTotal = initial + fee + body.summonsAmount + body.courtCharge
        body.totalCollectable = Math.round(newTotal * 100) / 100
        body.currentBalance = Math.max(
          0,
          Math.round((newTotal - (account.paymentsReceived || 0)) * 100) / 100,
        )
      }

      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const msg = addCourtCharges
          ? `Account sent to legal with court charges ($${body.summonsAmount} summons + $${body.courtCharge} court fee)`
          : 'Account sent to legal review'
        showToast(msg)
        window.location.reload()
      } else {
        showToast('Failed to send to legal', 'error')
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
        className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {submitting ? 'Sending…' : 'Send to Legal'}
      </button>

      <ConfirmModal
        open={showModal}
        title="Send to Legal Review"
        message="This will flag the account for legal review. A Claims Officer will evaluate the case."
        confirmLabel="Send to Legal"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleSendToLegal}
        onCancel={() => setShowModal(false)}
      >
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <label className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200 cursor-pointer">
            <input
              type="checkbox"
              checked={addCourtCharges}
              onChange={(e) => setAddCourtCharges(e.target.checked)}
              className="rounded"
            />
            <span>Add court charges ($25-50 summons + $4 court fee)</span>
          </label>
          {addCourtCharges && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 ml-6">
              Summons: $25 (Belize City) or $50 (elsewhere) + $4 court filing fee
            </p>
          )}
        </div>
      </ConfirmModal>
    </>
  )
}
