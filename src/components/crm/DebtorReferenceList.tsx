import { getPayload } from '@/payload'
import { LogReferenceCallButton } from '@/components/crm/LogReferenceCallButton'

export async function DebtorReferenceList({ accountId }: { accountId: string }) {
  const payload = await getPayload()
  const refs = await payload.find({
    collection: 'debtor-references',
    where: { account: { equals: accountId } },
    sort: 'name',
  })

  return (
    <div>
      <h4 className="font-semibold mb-2">References</h4>
      {refs.docs.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No references added yet.</p>
      )}
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {refs.docs.map((ref: any) => (
          <li key={ref.id} className="py-2 flex items-center justify-between relative">
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">{ref.name}</span>
              {ref.relationship && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({ref.relationship})
                </span>
              )}
              {ref.phone && (
                <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                  📞 {ref.phone}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {ref.phone && (
                <a
                  href={`tel:${ref.phone}`}
                  className="text-green-600 dark:text-green-400 hover:underline text-sm"
                >
                  Call
                </a>
              )}
              <LogReferenceCallButton accountId={accountId} referenceName={ref.name} />
              <RemoveReferenceButton referenceId={ref.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RemoveReferenceButton({ referenceId }: { referenceId: string }) {
  'use client'
  async function handleRemove() {
    if (!confirm('Remove this reference?')) return
    const res = await fetch(`/api/debtor-references/${referenceId}`, { method: 'DELETE' })
    if (res.ok) window.location.reload()
    else alert('Failed to remove reference')
  }
  return (
    <button
      onClick={handleRemove}
      className="text-red-600 dark:text-red-400 hover:underline text-sm"
    >
      Remove
    </button>
  )
}
