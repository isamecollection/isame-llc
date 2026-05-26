'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function AddReferenceForm({ accountId }: { accountId: string }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [relationship, setRelationship] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name) {
      showToast('Name is required', 'error')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/debtor-references', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: accountId, name, phone, relationship }),
    })
    if (res.ok) {
      setName('')
      setPhone('')
      setRelationship('')
      showToast('Reference added')
      window.location.reload()
    } else {
      showToast('Failed to add reference', 'error')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4">
      <h4 className="font-medium">Add Reference</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          placeholder="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        />
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        />
        <input
          placeholder="Relationship"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Adding…' : 'Add Reference'}
      </button>
    </form>
  )
}
