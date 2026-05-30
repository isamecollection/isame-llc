import { getPayload } from '@/payload'
import Link from 'next/link'

export default async function ClaimsOfficerDashboard() {
  const payload = await getPayload()

  // 1. Accounts pending legal review
  const pendingAccounts = await payload.find({
    collection: 'accounts',
    where: { legalStatus: { equals: 'pending_review' } },
    sort: '-currentBalance',
    depth: 1,
  })

  // 2. All court agents (for assignment dropdown)
  const courtAgents = await payload.find({
    collection: 'users',
    where: { roles: { contains: 'court-agent' } },
    sort: 'name',
  })

  // 3. All process servers (for assignment dropdown)
  const processServers = await payload.find({
    collection: 'users',
    where: { roles: { contains: 'process-server' } },
    sort: 'name',
  })

  // 4. Active legal cases (status not closed)
  const activeCases = await payload.find({
    collection: 'legal-cases',
    where: { status: { not_equals: 'closed' } },
    sort: '-createdAt',
    depth: 2,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Claims Officer Dashboard</h1>

      {/* ─── Pending Review ─── */}
      <h2 className="text-xl font-semibold mb-3">Accounts Pending Legal Review</h2>
      {pendingAccounts.totalDocs === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          No accounts currently require review.
        </p>
      ) : (
        <div className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg mb-8">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Debtor Name</th>
                <th className="px-4 py-3 font-semibold">Account #</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Balance</th>
                <th className="px-4 py-3 font-semibold">Assign Court Agent</th>
                <th className="px-4 py-3 font-semibold">Assign Process Server</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {pendingAccounts.docs.map((account: any) => (
                <tr
                  key={account.id}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3">{account.debtorName || 'Unknown'}</td>
                  <td className="px-4 py-3">{account.accountNumber}</td>
                  <td className="px-4 py-3">{(account.client as any)?.name || '—'}</td>
                  <td className="px-4 py-3">${account.currentBalance?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <AssignDropdown
                      accountId={account.id}
                      currentValue={account.assignedCourtAgent}
                      agents={courtAgents.docs}
                      field="assignedCourtAgent"
                      statusAfter="assigned"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <AssignDropdown
                      accountId={account.id}
                      currentValue={account.assignedProcessServer}
                      agents={processServers.docs}
                      field="assignedProcessServer"
                      statusAfter="pending_service"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/crm/accounts/${account.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Active Legal Cases ─── */}
      <h2 className="text-xl font-semibold mb-3">Active Legal Cases</h2>
      {activeCases.totalDocs === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No active legal cases.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeCases.docs.map((c: any) => {
            const now = new Date()
            const nextEvent = (c.courtEvents || [])
              .filter((ev: any) => new Date(ev.eventDate) > now)
              .sort(
                (a: any, b: any) =>
                  new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
              )[0]

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {c.account?.debtorName || 'Unknown Debtor'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {c.account?.accountNumber}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 capitalize">
                    {c.status?.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                  {c.caseNumber && (
                    <p>
                      <span className="font-medium">Case #:</span> {c.caseNumber}
                    </p>
                  )}
                  {c.court && (
                    <p>
                      <span className="font-medium">Court:</span> {c.court}
                    </p>
                  )}
                  {c.assignedTo && (
                    <p>
                      <span className="font-medium">Agent:</span>{' '}
                      {(c.assignedTo as any)?.name || c.assignedTo}
                    </p>
                  )}
                </div>

                {nextEvent ? (
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300 mb-1">
                      Next Event
                    </p>
                    <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                      {new Date(nextEvent.eventDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 capitalize">
                      {nextEvent.eventType}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      No upcoming events
                    </p>
                  </div>
                )}

                <Link
                  href={`/crm/accounts/${c.account?.id}`}
                  className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  View Account →
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Inline client component for assignment dropdowns ─── */
function AssignDropdown({
  accountId,
  currentValue,
  agents,
  field,
  statusAfter,
}: {
  accountId: string
  currentValue?: string
  agents: any[]
  field: string
  statusAfter: string
}) {
  'use client'
  const { useState } = require('react')
  const { showToast } = require('@/components/Toast').useToast()
  const [selectedId, setSelectedId] = useState(currentValue || '')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value
    setSelectedId(newId)
    setSubmitting(true)
    const body: any = { [field]: newId || null }
    if (field === 'assignedCourtAgent') body.legalStatus = newId ? 'assigned' : 'pending_review'
    if (field === 'assignedProcessServer')
      body.serviceStatus = newId ? 'pending_service' : 'not_assigned'
    const res = await fetch(`/api/accounts/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      showToast('Assigned successfully')
    } else {
      showToast('Failed to assign', 'error')
      setSelectedId(currentValue || '')
    }
    setSubmitting(false)
  }

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      disabled={submitting}
      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm"
    >
      <option value="">Unassigned</option>
      {agents.map((a: any) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  )
}
