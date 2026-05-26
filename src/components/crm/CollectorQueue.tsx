'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/Toast'

export function CollectorQueue({ collectorId }: { collectorId: string }) {
  const [queue, setQueue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    broken: true,
    noContact: true,
    highBalance: false,
    other: false,
  })
  const { showToast } = useToast()

  useEffect(() => {
    fetchQueue()
  }, [collectorId])

  const fetchQueue = async () => {
    setLoading(true)
    const res = await fetch(`/api/collector-queue?collectorId=${collectorId}`)
    const data = await res.json()
    setQueue(data)
    setLoading(false)
  }

  const logContact = async (accountId: string) => {
    // Mark the account as contacted today
    await fetch(`/api/accounts/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastContactedAt: new Date().toISOString() }),
    })
    showToast('Contact logged')
    fetchQueue() // refresh the queue
  }

  const toggleSection = (section: string) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  if (loading) return <p className="text-gray-500">Loading queue…</p>
  if (!queue) return <p className="text-gray-500">No accounts found.</p>

  const sections = [
    { key: 'broken', title: '🔴 Broken Promises', accounts: queue.broken || [] },
    { key: 'noContact', title: '🟡 No Recent Contact (30+ days)', accounts: queue.noContact || [] },
    { key: 'highBalance', title: '🟢 High Balance ($5,000+)', accounts: queue.highBalance || [] },
    { key: 'other', title: '⚪ Other Active', accounts: queue.other || [] },
  ]

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div
          key={section.key}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
        >
          <button
            onClick={() => toggleSection(section.key)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-semibold">{section.title}</h3>
            <span className="text-sm text-gray-500">{section.accounts.length} accounts</span>
          </button>
          {expanded[section.key] && section.accounts.length > 0 && (
            <div className="max-h-64 overflow-y-auto border-t border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Debtor Name</th>
                    <th className="px-4 py-2 font-semibold">Balance</th>
                    <th className="px-4 py-2 font-semibold">Last Contact</th>
                    <th className="px-4 py-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {section.accounts.map((account: any) => (
                    <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-2">
                        <Link
                          href={`/crm/accounts/${account.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {account.debtorName || 'Unknown'}
                        </Link>
                      </td>
                      <td className="px-4 py-2">${account.currentBalance?.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        {account.lastContactedAt
                          ? new Date(account.lastContactedAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => logContact(account.id)}
                          className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                          Log Contact
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {expanded[section.key] && section.accounts.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">No accounts in this category.</p>
          )}
        </div>
      ))}
    </div>
  )
}
