'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AssigneeCell } from '@/components/crm/AssigneeCell'
import { useToast } from '@/components/Toast'

const PAGE_SIZE = 20

export function FilterableAccountsTable({
  baseFilter,
  showAssignment,
  collectors,
}: {
  baseFilter?: any
  showAssignment?: boolean
  collectors?: any[]
}) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Search filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [minBalance, setMinBalance] = useState('')
  const [maxBalance, setMaxBalance] = useState('')
  const [clientId, setClientId] = useState('')

  // Bulk assign state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkCollector, setBulkCollector] = useState('')
  const [bulkAssigning, setBulkAssigning] = useState(false)

  const [clients, setClients] = useState<any[]>([])
  const { showToast } = useToast()

  useEffect(() => {
    fetch('/api/clients?sort=name&limit=200')
      .then((r) => r.json())
      .then((data) => setClients(data.docs || []))
  }, [])

  const fetchAccounts = async (pageNum = 1) => {
    setLoading(true)
    setPage(pageNum)

    const params = new URLSearchParams()
    params.append('sort', '-currentBalance')
    params.append('limit', PAGE_SIZE.toString())
    params.append('page', pageNum.toString())
    params.append('depth', '1')

    const where: any = { ...baseFilter }

    if (search) {
      where.or = [{ debtorName: { contains: search } }, { accountNumber: { contains: search } }]
    }
    if (statusFilter) where.status = { equals: statusFilter }
    if (clientId) where.client = { equals: clientId }

    if (minBalance || maxBalance) {
      where.and = where.and || []
      if (minBalance)
        where.and.push({ currentBalance: { greater_than_equal: parseFloat(minBalance) } })
      if (maxBalance)
        where.and.push({ currentBalance: { less_than_equal: parseFloat(maxBalance) } })
    }

    params.append('where', JSON.stringify(where))

    const res = await fetch(`/api/accounts?${params.toString()}`)
    const data = await res.json()
    setAccounts(data.docs || [])
    setTotalPages(data.totalPages || 1)
    setSelectedIds([]) // reset selections when page changes or search is applied
    setLoading(false)
  }

  useEffect(() => {
    fetchAccounts(1)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAccounts(1)
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(accounts.map((a) => a.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleBulkAssign = async () => {
    if (!bulkCollector || selectedIds.length === 0) return
    setBulkAssigning(true)
    let success = 0
    let failed = 0

    for (const accountId of selectedIds) {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedCollector: bulkCollector }),
      })
      if (res.ok) success++
      else failed++
    }

    showToast(`Assigned ${success} account(s).${failed > 0 ? ` ${failed} failed.` : ''}`)
    setSelectedIds([])
    setBulkCollector('')
    setBulkAssigning(false)
    fetchAccounts(page) // refresh table
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div>
      {/* Filter bar */}
      <form
        onSubmit={handleSearch}
        className="mb-4 flex flex-wrap gap-3 items-end bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div>
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <input
            type="text"
            placeholder="Name or Account #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="settled">Settled</option>
            <option value="paid">Paid</option>
            <option value="bankruptcy">Bankruptcy</option>
            <option value="legal">Legal</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-44 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="">All Clients</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Min Balance</label>
          <input
            type="number"
            placeholder="0"
            value={minBalance}
            onChange={(e) => setMinBalance(e.target.value)}
            className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Max Balance</label>
          <input
            type="number"
            placeholder="999999"
            value={maxBalance}
            onChange={(e) => setMaxBalance(e.target.value)}
            className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Search
        </button>
      </form>

      {/* Bulk assign toolbar */}
      {showAssignment && selectedIds.length > 0 && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg flex items-center gap-3">
          <span className="text-sm text-blue-800 dark:text-blue-200">
            {selectedIds.length} account(s) selected
          </span>
          <select
            value={bulkCollector}
            onChange={(e) => setBulkCollector(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
          >
            <option value="">Assign to…</option>
            {collectors?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkAssign}
            disabled={!bulkCollector || bulkAssigning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {bulkAssigning ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : accounts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No accounts found.</p>
      ) : (
        <>
          <div className="max-h-125 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <tr>
                  {showAssignment && (
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === accounts.length && accounts.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 font-semibold">Debtor Name</th>
                  <th className="px-4 py-3 font-semibold">Account #</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Balance</th>
                  {showAssignment && (
                    <th className="px-4 py-3 font-semibold">Assigned Collector</th>
                  )}
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {accounts.map((account: any) => (
                  <tr
                    key={account.id}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {showAssignment && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(account.id)}
                          onChange={() => toggleSelect(account.id)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">{account.debtorName || 'Unknown'}</td>
                    <td className="px-4 py-3">{account.accountNumber}</td>
                    <td className="px-4 py-3">{(account.client as any)?.name || '—'}</td>
                    <td className="px-4 py-3">${account.currentBalance?.toLocaleString()}</td>
                    {showAssignment && (
                      <td className="px-4 py-3">
                        <AssigneeCell
                          accountId={account.id}
                          currentCollectorId={account.assignedCollector as string}
                          collectors={collectors || []}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">{account.status}</td>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => fetchAccounts(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => fetchAccounts(p)}
                  className={`px-3 py-1 rounded text-sm ${
                    p === page ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => fetchAccounts(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
