import { getPayload } from '@/payload'
import { notFound } from 'next/navigation'
import { MergeForm } from '@/components/crm/MergeForm'

export default async function MergePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload()

  let sourceAccount
  try {
    sourceAccount = await payload.findByID({ collection: 'accounts', id, depth: 1 })
  } catch {
    notFound()
  }

  // Fetch potential targets (same SSN if SSN exists, otherwise recent accounts)
  let candidates: any[] = []
  if (sourceAccount.ssn) {
    const res = await payload.find({
      collection: 'accounts',
      where: {
        and: [{ ssn: { equals: sourceAccount.ssn } }, { id: { not_equals: sourceAccount.id } }],
      },
      sort: '-createdAt',
      limit: 50,
    })
    candidates = res.docs
  }

  if (candidates.length === 0) {
    const res = await payload.find({
      collection: 'accounts',
      where: { id: { not_equals: sourceAccount.id } },
      sort: '-createdAt',
      limit: 20,
    })
    candidates = res.docs
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Merge Account</h1>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4">
        <p className="text-lg">
          Source: <strong>{sourceAccount.debtorName}</strong> (#{sourceAccount.accountNumber})
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Balance: ${sourceAccount.currentBalance?.toLocaleString()}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <MergeForm sourceId={sourceAccount.id} candidates={candidates} />
      </div>
    </div>
  )
}
