'use client'
import { useState, useEffect, useCallback } from 'react'
import { RecordPaymentForm } from '@/components/crm/RecordPaymentForm'
import { CreateAgreementForm } from '@/components/crm/CreateAgreementForm'

export function ActionsSection({
  accountId,
  currentBalance,
}: {
  accountId: string
  currentBalance: number
}) {
  const [balance, setBalance] = useState(currentBalance)
  const [key, setKey] = useState(0)

  const refreshBalance = useCallback(async () => {
    const res = await fetch(`/api/accounts/${accountId}`)
    if (res.ok) {
      const data = await res.json()
      setBalance(data.currentBalance ?? 0)
    }
  }, [accountId])

  const handleSuccess = () => {
    refreshBalance()
    setKey((prev) => prev + 1) // re‑mount forms to clear their state
  }

  useEffect(() => {
    setBalance(currentBalance)
  }, [currentBalance])

  return (
    <div className="space-y-6" key={key}>
      <RecordPaymentForm accountId={accountId} currentBalance={balance} onSuccess={handleSuccess} />
      <CreateAgreementForm
        accountId={accountId}
        currentBalance={balance}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
