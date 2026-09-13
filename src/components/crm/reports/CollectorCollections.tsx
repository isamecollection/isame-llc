'use client'
import { useState, useEffect, useMemo } from 'react'
import { useToast } from '@/components/Toast'

type Row = {
  id: string
  date: string | null
  createdAt: string
  collectorId: string | null
  collectorName: string
  accountId: string | null
  accountNumber: string
  debtorName: string
  clientId: string | null
  clientName: string
  method: string
  amount: number
  isameShare: number
  clientShare: number
  reference: string
}

type ApiResponse = {
  rows: Row[]
  totals: { count: number; amount: number; isameShare: number; clientShare: number }
  refunded: { count: number; total: number }
  filters: {
    from: string | null
    to: string | null
    collectorIds: string[]
    clientId: string | null
  }
  clientIdsSeen: string[]
  collectorIdsSeen: string[]
}

type UserOption = { id: string; name: string; roles: string[] }
type ClientOption = { id: string; name: string }

export function CollectorCollections({
  users,
  clients,
}: {
  users: UserOption[]
  clients: ClientOption[]
}) {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const [from, setFrom] = useState(fmt(firstOfMonth))
  const [to, setTo] = useState(fmt(today))
  const [collectorIds, setCollectorIds] = useState<string[]>([])
  const [clientId, setClientId] = useState<string>('')
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const collectorsAvailable = useMemo(() => {
    return users.filter((u) =>
      u.roles?.some((r) =>
        [
          'collector',
          'supervisor',
          'crm-manager',
          'admin',
          'court-agent',
          'process-server',
        ].includes(r),
      ),
    )
  }, [users])

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (collectorIds.length > 0) params.set('collectors', collectorIds.join(','))
      if (clientId) params.set('client', clientId)

      const res = await fetch(`/api/reports/collector-collections?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast(err.error || 'Failed to load report', 'error')
        return
      }
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const buildFilterParams = () => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (collectorIds.length > 0) params.set('collectors', collectorIds.join(','))
    if (clientId) params.set('client', clientId)
    return params
  }

  const isStale = () => {
    if (!data) return false
    const f = data.filters
    return (
      (f.from || '') !== (from || '') ||
      (f.to || '') !== (to || '') ||
      f.clientId !== (clientId || null) ||
      JSON.stringify([...f.collectorIds].sort()) !== JSON.stringify([...collectorIds].sort())
    )
  }

  const handlePdf = () => {
    if (isStale()) {
      const proceed = confirm(
        'The table on screen does not reflect your current filters.\n\n' +
          'The PDF will be generated using the filters you just selected. Continue?',
      )
      if (!proceed) return
    }
    window.open(
      `/api/reports/collector-collections/pdf?${buildFilterParams().toString()}`,
      '_blank',
    )
  }

  const handleCsv = () => {
    if (isStale()) {
      const proceed = confirm(
        'The table on screen does not reflect your current filters.\n\n' +
          'The CSV will be generated using the filters you just selected. Continue?',
      )
      if (!proceed) return
    }
    const params = buildFilterParams()
    params.set('format', 'csv')
    window.location.href = `/api/reports/collector-collections?${params.toString()}`
  }

  const toggleCollector = (id: string) => {
    setCollectorIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const grandTotal = data?.totals.amount ?? 0
  const grandIsame = data?.totals.isameShare ?? 0
  const grandClient = data?.totals.clientShare ?? 0

  const visibleClientIds = data?.clientIdsSeen ?? []
  const visibleClients = clients.filter((c) => visibleClientIds.includes(c.id))

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">All clients</option>
              {(visibleClients.length > 0 ? visibleClients : clients).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Loading…' : 'Apply'}
            </button>
            <button
              type="button"
              onClick={handlePdf}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              title="Export PDF"
            >
              📄 PDF
            </button>
            <button
              type="button"
              onClick={handleCsv}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              title="Export CSV"
            >
              📊 CSV
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-2">
            Collectors {collectorIds.length > 0 && `(${collectorIds.length} selected)`}
          </label>
          <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-900">
            <div className="flex flex-wrap gap-2">
              {collectorsAvailable.map((u) => {
                const active = collectorIds.includes(u.id)
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleCollector(u.id)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500'
                    }`}
                  >
                    {u.name}
                  </button>
                )
              })}
              {collectorsAvailable.length === 0 && (
                <p className="text-xs text-gray-400 italic">No collectors found</p>
              )}
            </div>
          </div>
          {collectorIds.length > 0 && (
            <button
              type="button"
              onClick={() => setCollectorIds([])}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <StatCard label="Payments" value={String(data.totals.count)} />
          <StatCard label="Total Collected" value={`$${grandTotal.toLocaleString()}`} />
          <StatCard label="ISAME (20%)" value={`$${grandIsame.toLocaleString()}`} accent="blue" />
          <StatCard
            label="Client (80%)"
            value={`$${grandClient.toLocaleString()}`}
            accent="green"
          />
        </div>
      )}

      {data && data.refunded.count > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
          ⚠️ <strong>{data.refunded.count}</strong> refunded payment(s) totaling{' '}
          <strong>${data.refunded.total.toLocaleString()}</strong> excluded from this report. See
          Audit Logs for details.
        </div>
      )}

      {data && data.rows.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Collector
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Account #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Debtor
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Client
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Method
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Payment
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                    ISAME 20%
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Client 80%
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="px-3 py-2 text-xs">{r.date || '—'}</td>
                    <td className="px-3 py-2 text-xs">{r.collectorName}</td>
                    <td className="px-3 py-2 text-xs font-mono">{r.accountNumber}</td>
                    <td className="px-3 py-2 text-xs">{r.debtorName}</td>
                    <td className="px-3 py-2 text-xs">{r.clientName}</td>
                    <td className="px-3 py-2 text-xs capitalize">{r.method.replace('_', ' ')}</td>
                    <td className="px-3 py-2 text-xs text-right font-medium">
                      ${r.amount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-xs text-right text-blue-600 dark:text-blue-400">
                      ${r.isameShare.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-xs text-right text-green-600 dark:text-green-400">
                      ${r.clientShare.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600">
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-3 text-xs font-bold text-gray-700 dark:text-gray-300"
                  >
                    GRAND TOTAL
                  </td>
                  <td className="px-3 py-3 text-sm text-right font-bold">
                    ${grandTotal.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-sm text-right font-bold text-blue-700 dark:text-blue-300">
                    ${grandIsame.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-sm text-right font-bold text-green-700 dark:text-green-300">
                    ${grandClient.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {data && data.rows.length === 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center text-gray-500">
          No payments found for the selected filters.
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'blue' | 'green'
}) {
  const colors =
    accent === 'blue'
      ? 'text-blue-600 dark:text-blue-400'
      : accent === 'green'
        ? 'text-green-600 dark:text-green-400'
        : 'text-gray-800 dark:text-gray-200'

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors}`}>{value}</p>
    </div>
  )
}
