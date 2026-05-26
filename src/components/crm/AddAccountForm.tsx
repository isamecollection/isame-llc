'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function AddAccountForm({ clients }: { clients: any[] }) {
  const [debtorName, setDebtorName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ssn, setSsn] = useState('')
  const [originalBalance, setOriginalBalance] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  const [status, setStatus] = useState('active')
  const [clientId, setClientId] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [employer, setEmployer] = useState('')
  const [workPhone, setWorkPhone] = useState('')
  const [homePhone, setHomePhone] = useState('')

  // References
  const [references, setReferences] = useState<
    { name: string; phone: string; relationship: string }[]
  >([])
  const [newRef, setNewRef] = useState({ name: '', phone: '', relationship: '' })

  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const addReference = () => {
    if (!newRef.name) return
    setReferences([...references, newRef])
    setNewRef({ name: '', phone: '', relationship: '' })
  }

  const removeReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    // 1. Create the account
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        debtorName,
        accountNumber: accountNumber || undefined,
        ssn: ssn || undefined,
        originalBalance: parseFloat(originalBalance) || 0,
        currentBalance: parseFloat(currentBalance) || 0,
        status,
        client: clientId || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        employer: employer || undefined,
        workPhone: workPhone || undefined,
        homePhone: homePhone || undefined,
      }),
    })

    if (!res.ok) {
      showToast('Failed to create account', 'error')
      setSubmitting(false)
      return
    }

    const account = await res.json()
    const accountId = account.doc.id

    // 2. Create references
    for (const ref of references) {
      await fetch('/api/debtor-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: accountId,
          name: ref.name,
          phone: ref.phone,
          relationship: ref.relationship,
        }),
      })
    }

    showToast('Account created')
    window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Add Single Account</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          placeholder="Debtor Name *"
          value={debtorName}
          onChange={(e) => setDebtorName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          placeholder="Account Number (optional)"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          placeholder="SSN (optional)"
          value={ssn}
          onChange={(e) => setSsn(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          placeholder="Original Balance"
          type="number"
          value={originalBalance}
          onChange={(e) => setOriginalBalance(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          placeholder="Current Balance"
          type="number"
          value={currentBalance}
          onChange={(e) => setCurrentBalance(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          <option value="active">Active</option>
          <option value="settled">Settled</option>
          <option value="paid">Paid</option>
          <option value="bankruptcy">Bankruptcy</option>
          <option value="legal">Legal</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          <option value="">-- select client (optional) --</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.prefix})
            </option>
          ))}
        </select>
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          placeholder="Employer"
          value={employer}
          onChange={(e) => setEmployer(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          placeholder="Work Phone"
          value={workPhone}
          onChange={(e) => setWorkPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          placeholder="Home Phone"
          value={homePhone}
          onChange={(e) => setHomePhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <textarea
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* References section */}
      <div>
        <h4 className="font-medium mb-2">References</h4>
        {references.map((ref, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <span className="text-sm">
              {ref.name} {ref.phone ? `— ${ref.phone}` : ''}{' '}
              {ref.relationship ? `(${ref.relationship})` : ''}
            </span>
            <button
              type="button"
              onClick={() => removeReference(idx)}
              className="text-red-600 text-sm"
            >
              Remove
            </button>
          </div>
        ))}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            placeholder="Name"
            value={newRef.name}
            onChange={(e) => setNewRef({ ...newRef, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Phone"
            value={newRef.phone}
            onChange={(e) => setNewRef({ ...newRef, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Relationship"
            value={newRef.relationship}
            onChange={(e) => setNewRef({ ...newRef, relationship: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
        </div>
        <button
          type="button"
          onClick={addReference}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          + Add Reference
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Creating…' : 'Create Account'}
      </button>
    </form>
  )
}
