'use client'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'

export function EditAccountForm({ account, clients }: { account: any; clients: any[] }) {
  const [debtorName, setDebtorName] = useState(account.debtorName || '')
  const [ssn, setSsn] = useState(account.ssn || '')
  const [phone, setPhone] = useState(account.phone || '')
  const [email, setEmail] = useState(account.email || '')
  const [address, setAddress] = useState(account.address || '')
  const [employer, setEmployer] = useState(account.employer || '')
  const [workPhone, setWorkPhone] = useState(account.workPhone || '')
  const [homePhone, setHomePhone] = useState(account.homePhone || '')
  const [clientId, setClientId] = useState(account.client?.id || account.client || '')
  const [submitting, setSubmitting] = useState(false)

  const [references, setReferences] = useState<any[]>([])
  const [newRef, setNewRef] = useState({ name: '', phone: '', relationship: '' })
  const [refsLoaded, setRefsLoaded] = useState(false)

  const { showToast } = useToast()

  useEffect(() => {
    async function loadRefs() {
      const res = await fetch(
        `/api/debtor-references?where[account][equals]=${account.id}&limit=50`,
      )
      const data = await res.json()
      setReferences(data.docs || [])
      setRefsLoaded(true)
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
    const res = await fetch(`/api/accounts/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        debtorName,
        ssn: ssn || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        employer: employer || undefined,
        workPhone: workPhone || undefined,
        homePhone: homePhone || undefined,
        client: clientId || null,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          placeholder="Debtor Name"
          value={debtorName}
          onChange={(e) => setDebtorName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          placeholder="SSN"
          value={ssn}
          onChange={(e) => setSsn(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
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
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          <option value="">-- no client --</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.prefix})
            </option>
          ))}
        </select>
      </div>

      {/* References section */}
      <div>
        <h4 className="font-medium mb-2">References</h4>
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
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
