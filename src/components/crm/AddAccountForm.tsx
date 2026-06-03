'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function AddAccountForm({ clients }: { clients: any[] }) {
  const [debtorName, setDebtorName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ssn, setSsn] = useState('')
  const [initialAccount, setInitialAccount] = useState('')
  const [paymentsReceived, setPaymentsReceived] = useState('')
  const [status, setStatus] = useState('active')
  const [clientId, setClientId] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [street, setStreet] = useState('')
  const [townCity, setTownCity] = useState('')
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [employer, setEmployer] = useState('')
  const [workPhone, setWorkPhone] = useState('')
  const [homePhone, setHomePhone] = useState('')
  const [method, setMethod] = useState('')
  const [statusWithIsame, setStatusWithIsame] = useState('')

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

  // Calculate preview
  const initial = parseFloat(initialAccount) || 0
  const paid = parseFloat(paymentsReceived) || 0
  const amountToCollect = initial - paid
  const fee20Percent = Math.round(amountToCollect * 0.2 * 100) / 100
  const totalCollectable = Math.round((amountToCollect + fee20Percent) * 100) / 100

  // Determine summons amount based on location (for display only, not auto-charged)
  const isBelizeCity = townCity.toLowerCase().includes('belize city')
  const summonsEstimate = isBelizeCity ? 25 : 50

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        debtorName,
        accountNumber: accountNumber || undefined,
        ssn: ssn || undefined,
        initialAccount: initial,
        paymentsReceived: paid,
        fee20Percent,
        totalCollectable,
        currentBalance: totalCollectable,
        originalBalance: initial,
        summonsAmount: 0,
        courtCharge: 0,
        status,
        client: clientId || undefined,
        phone: phone || undefined,
        email: email || undefined,
        street: street || undefined,
        townCity: townCity || undefined,
        district: district || undefined,
        address: address || undefined,
        employer: employer || undefined,
        workPhone: workPhone || undefined,
        homePhone: homePhone || undefined,
        method: method || undefined,
        statusWithIsame: statusWithIsame || undefined,
      }),
    })

    if (!res.ok) {
      showToast('Failed to create account', 'error')
      setSubmitting(false)
      return
    }

    const account = await res.json()
    const accountId = account.doc.id

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

      {/* Basic Info */}
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
      </div>

      {/* Address Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📍 Address</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            placeholder="Street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="City/Town"
            value={townCity}
            onChange={(e) => setTownCity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="District"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
        </div>
        <textarea
          placeholder="Full Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 mt-2"
        />
      </div>

      {/* Financial Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">💰 Financial</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">
              Initial Account $ (Original Debt)
            </label>
            <input
              type="number"
              value={initialAccount}
              onChange={(e) => setInitialAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">
              Payments Received $ (Before Collections)
            </label>
            <input
              type="number"
              value={paymentsReceived}
              onChange={(e) => setPaymentsReceived(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        {/* Preview Calculation */}
        {initial > 0 && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
            <p className="text-blue-700 dark:text-blue-300">
              Amount to Collect: <strong>${amountToCollect.toLocaleString()}</strong>
              &nbsp;|&nbsp; 20% Fee: <strong>${fee20Percent.toLocaleString()}</strong>
              &nbsp;|&nbsp; Total Collectable: <strong>${totalCollectable.toLocaleString()}</strong>
            </p>
            {townCity && (
              <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                📍 {townCity} → Summons would be <strong>${summonsEstimate}</strong> if sent to
                court
              </p>
            )}
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📞 Contact</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>
      </div>

      {/* Other Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          placeholder="Method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          placeholder="Status w/ Isame"
          value={statusWithIsame}
          onChange={(e) => setStatusWithIsame(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* References */}
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
