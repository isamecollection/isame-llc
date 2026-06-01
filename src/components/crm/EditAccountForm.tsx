'use client'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'

export function EditAccountForm({ account, clients }: { account: any; clients: any[] }) {
  const [debtorName, setDebtorName] = useState(account.debtorName || '')
  const [ssn, setSsn] = useState(account.ssn || '')
  const [phone, setPhone] = useState(account.phone || '')
  const [email, setEmail] = useState(account.email || '')
  const [address, setAddress] = useState(account.address || '')
  const [street, setStreet] = useState(account.street || '')
  const [townCity, setTownCity] = useState(account.townCity || '')
  const [district, setDistrict] = useState(account.district || '')
  const [employer, setEmployer] = useState(account.employer || '')
  const [workPhone, setWorkPhone] = useState(account.workPhone || '')
  const [homePhone, setHomePhone] = useState(account.homePhone || '')
  const [clientId, setClientId] = useState(account.client?.id || account.client || '')

  // Import/Financial fields
  const [loanNo, setLoanNo] = useState(account.loanNo || '')
  const [initialAccount, setInitialAccount] = useState(account.initialAccount || '')
  const [paymentsReceived, setPaymentsReceived] = useState(account.paymentsReceived || '')
  const [method, setMethod] = useState(account.method || '')
  const [statusWithIsame, setStatusWithIsame] = useState(account.statusWithIsame || '')

  // Court/Legal fields
  const [suitNo, setSuitNo] = useState(account.suitNo || '')
  const [courtReceiptNo, setCourtReceiptNo] = useState(account.courtReceiptNo || '')
  const [lodge, setLodge] = useState(account.lodge || '')
  const [legalStatus, setLegalStatus] = useState(account.legalStatus || 'none')
  const [serviceStatus, setServiceStatus] = useState(account.serviceStatus || 'not_assigned')

  const [submitting, setSubmitting] = useState(false)

  const [references, setReferences] = useState<any[]>([])
  const [newRef, setNewRef] = useState({ name: '', phone: '', relationship: '' })

  const { showToast } = useToast()

  useEffect(() => {
    async function loadRefs() {
      const res = await fetch(
        `/api/debtor-references?where[account][equals]=${account.id}&limit=50`,
      )
      const data = await res.json()
      setReferences(data.docs || [])
    }
    loadRefs()
  }, [account.id])

  const addReference = async () => {
    if (!newRef.name) return
    const res = await fetch('/api/debtor-references', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: account.id, ...newRef }),
    })
    if (res.ok) {
      const ref = await res.json()
      setReferences([...references, ref.doc])
      setNewRef({ name: '', phone: '', relationship: '' })
      showToast('Reference added')
    } else {
      showToast('Failed to add reference', 'error')
    }
  }

  const removeReference = async (id: string) => {
    const res = await fetch(`/api/debtor-references/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setReferences(references.filter((r) => r.id !== id))
      showToast('Reference removed')
    } else {
      showToast('Failed to remove reference', 'error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    // Recalculate financials if initial account changed
    const initial = parseFloat(initialAccount) || 0
    const isBelizeCity = townCity.toLowerCase().includes('belize city')
    const courtCharge = 4
    const summonsAmount = isBelizeCity ? 25 : 50
    const fee20Percent = Math.round(initial * 0.2 * 100) / 100
    const totalCollectable =
      Math.round((initial + fee20Percent + summonsAmount + courtCharge) * 100) / 100
    const paid = parseFloat(paymentsReceived) || 0
    const currentBalance = Math.max(0, Math.round((totalCollectable - paid) * 100) / 100)

    const res = await fetch(`/api/accounts/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        debtorName,
        ssn: ssn || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        street: street || undefined,
        townCity: townCity || undefined,
        district: district || undefined,
        employer: employer || undefined,
        workPhone: workPhone || undefined,
        homePhone: homePhone || undefined,
        client: clientId || null,
        // Import fields
        loanNo: loanNo || undefined,
        initialAccount: initial || undefined,
        paymentsReceived: paid || undefined,
        method: method || undefined,
        statusWithIsame: statusWithIsame || undefined,
        // Court/Legal fields
        suitNo: suitNo || undefined,
        courtReceiptNo: courtReceiptNo || undefined,
        lodge: lodge || undefined,
        legalStatus: legalStatus || undefined,
        serviceStatus: serviceStatus || undefined,
        // Recalculated fields
        fee20Percent,
        summonsAmount,
        courtCharge,
        totalCollectable,
        currentBalance,
        originalBalance: initial,
      }),
    })
    if (res.ok) {
      showToast('Account updated')
      window.location.reload()
    } else {
      showToast('Failed to update account', 'error')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div>
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Basic Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            placeholder="Debtor Name *"
            value={debtorName}
            onChange={(e) => setDebtorName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="SSN"
            value={ssn}
            onChange={(e) => setSsn(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            placeholder="Street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="City/Town"
            value={townCity}
            onChange={(e) => setTownCity(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="District"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
        </div>
        <textarea
          placeholder="Full Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 mt-3"
        />
      </div>

      {/* Employment */}
      <div>
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Employment</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            placeholder="Employer"
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Work Phone"
            value={workPhone}
            onChange={(e) => setWorkPhone(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Home Phone"
            value={homePhone}
            onChange={(e) => setHomePhone(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Import/Financial Fields */}
      <div>
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Account & Financial Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            placeholder="Loan No."
            value={loanNo}
            onChange={(e) => setLoanNo(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Initial Account $"
            type="number"
            step="0.01"
            value={initialAccount}
            onChange={(e) => setInitialAccount(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Payments Received $"
            type="number"
            step="0.01"
            value={paymentsReceived}
            onChange={(e) => setPaymentsReceived(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Status w/ Isame"
            value={statusWithIsame}
            onChange={(e) => setStatusWithIsame(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          >
            <option value="">-- no client --</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.prefix})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Court/Legal Fields */}
      <div>
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Court & Legal</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            placeholder="Suit No."
            value={suitNo}
            onChange={(e) => setSuitNo(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Court Receipt No."
            value={courtReceiptNo}
            onChange={(e) => setCourtReceiptNo(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Lodge"
            value={lodge}
            onChange={(e) => setLodge(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <select
            value={legalStatus}
            onChange={(e) => setLegalStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          >
            <option value="none">Legal: None</option>
            <option value="pending_review">Legal: Pending Review</option>
            <option value="assigned">Legal: Assigned</option>
            <option value="in_court">Legal: In Court</option>
            <option value="closed">Legal: Closed</option>
          </select>
          <select
            value={serviceStatus}
            onChange={(e) => setServiceStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          >
            <option value="not_assigned">Service: Not Assigned</option>
            <option value="pending_service">Service: Pending</option>
            <option value="served">Service: Served</option>
            <option value="not_found">Service: Not Found</option>
            <option value="completed">Service: Completed</option>
          </select>
        </div>
      </div>

      {/* References */}
      <div>
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">References</h4>
        {references.map((ref) => (
          <div key={ref.id} className="flex items-center justify-between py-1">
            <span className="text-sm">
              {ref.name} {ref.phone ? `— ${ref.phone}` : ''}{' '}
              {ref.relationship ? `(${ref.relationship})` : ''}
            </span>
            <button
              type="button"
              onClick={() => removeReference(ref.id)}
              className="text-red-600 text-sm"
            >
              Remove
            </button>
          </div>
        ))}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          <input
            placeholder="Name"
            value={newRef.name}
            onChange={(e) => setNewRef({ ...newRef, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Phone"
            value={newRef.phone}
            onChange={(e) => setNewRef({ ...newRef, phone: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <input
            placeholder="Relationship"
            value={newRef.relationship}
            onChange={(e) => setNewRef({ ...newRef, relationship: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
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
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
