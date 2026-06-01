'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { ConfirmModal } from '@/components/crm/ConfirmModal'

export function EditClientForm({ client }: { client: any }) {
  const [name, setName] = useState(client.name || '')
  const [email, setEmail] = useState(client.email || '')
  const [address, setAddress] = useState(client.address || '')
  const [phone, setPhone] = useState(client.phone || '')
  const [contactPerson, setContactPerson] = useState(client.contactPerson || '')
  const [prefix, setPrefix] = useState(client.prefix || '')
  const [submitting, setSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [updateAccounts, setUpdateAccounts] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const { showToast } = useToast()

  const prefixChanged = prefix !== client.prefix

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Show custom modal instead of confirm()
    if (prefixChanged && updateAccounts) {
      setShowConfirmModal(true)
      return
    }

    await saveClient()
  }

  async function saveClient() {
    setSubmitting(true)

    const res = await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: email || undefined,
        address: address || undefined,
        phone: phone || undefined,
        contactPerson: contactPerson || undefined,
        prefix,
        updateAccountPrefixes: prefixChanged && updateAccounts,
        oldPrefix: client.prefix,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      const msg =
        prefixChanged && updateAccounts
          ? `✅ Client updated. ${data.accountsUpdated || 0} account numbers updated.`
          : 'Client updated'
      showToast(msg)
      window.location.reload()
    } else {
      showToast('Failed to update client', 'error')
    }
    setSubmitting(false)
    setShowConfirmModal(false)
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="text-sm text-blue-600 hover:underline">
        Edit
      </button>
    )
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mt-3 space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            placeholder="Client Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          />
          <input
            placeholder="Prefix (e.g. JBW) *"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            required
            maxLength={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          />
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          />
          <input
            placeholder="Contact Person"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>
        <textarea
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
        />

        {prefixChanged && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4">
            <p className="text-sm font-bold text-red-800 dark:text-red-200 mb-2">
              ⚠️ Warning: Prefix Change Detected
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
              Changing from <strong>{client.prefix}</strong> to <strong>{prefix}</strong> will
              update the account number prefix on ALL accounts.
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mb-3">
              ✅ Safe: All assignments are linked by ID, not account number.
            </p>
            <label className="flex items-center gap-2 text-sm text-red-800 dark:text-red-200 font-medium">
              <input
                type="checkbox"
                checked={updateAccounts}
                onChange={(e) => setUpdateAccounts(e.target.checked)}
                className="rounded"
              />
              I understand. Update ALL account numbers from {client.prefix}# to {prefix}#
            </label>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        open={showConfirmModal}
        title="Confirm Prefix Change"
        message={`This will permanently change the prefix on ALL accounts for ${client.name}.\n\nFrom: "${client.prefix}#0001-XXXX"\nTo: "${prefix}#0001-XXXX"\n\nAll assignments (collectors, court agents, process servers) and related records are linked by ID — nothing will be lost.`}
        confirmLabel="Yes, Update All Accounts"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={saveClient}
        onCancel={() => setShowConfirmModal(false)}
      />
    </>
  )
}
