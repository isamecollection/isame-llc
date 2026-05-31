'use client'
import { useState, useEffect } from 'react'

interface Account {
  id: string
  accountNumber: string
  debtorName: string
  currentBalance: number
  totalCollectable: number
  paymentsReceived: number
  suitNo: string
  courtReceiptNo: string
  lodge: string
  townCity: string
  district: string
  street: string
  method: string
  legalStatus: string
  assignedCourtAgent?: string | { id: string; name: string }
}

interface CourtAgent {
  id: string
  name: string
  email: string
}

export function ClaimsOfficerQueue() {
  const [courtReadyAccounts, setCourtReadyAccounts] = useState<Account[]>([])
  const [pendingAccounts, setPendingAccounts] = useState<Account[]>([])
  const [activeLegalCases, setActiveLegalCases] = useState<any[]>([])
  const [courtAgents, setCourtAgents] = useState<CourtAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'court-ready' | 'pending' | 'active-cases'>(
    'court-ready',
  )
  const [selectedAgent, setSelectedAgent] = useState<Record<string, string>>({})
  const [assigning, setAssigning] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/claims-officer')
      const data = await res.json()
      setCourtReadyAccounts(data.courtReadyAccounts || [])
      setPendingAccounts(data.pendingAccounts || [])
      setActiveLegalCases(data.activeLegalCases || [])
      setCourtAgents(data.courtAgents || [])
    } catch (error) {
      console.error('Failed to fetch claims data:', error)
    }
    setLoading(false)
  }

  const handleAssign = async (accountId: string) => {
    const agentId = selectedAgent[accountId]
    if (!agentId) {
      alert('Please select a court agent')
      return
    }

    setAssigning((prev) => ({ ...prev, [accountId]: true }))
    try {
      const res = await fetch('/api/claims/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, courtAgentId: agentId }),
      })

      if (res.ok) {
        // Refresh data
        await fetchData()
        // Clear selection
        setSelectedAgent((prev) => {
          const next = { ...prev }
          delete next[accountId]
          return next
        })
      } else {
        const error = await res.json()
        alert(`Failed to assign: ${error.error}`)
      }
    } catch (error) {
      console.error('Assignment error:', error)
      alert('Failed to assign account')
    }
    setAssigning((prev) => ({ ...prev, [accountId]: false }))
  }

  if (loading) {
    return <p className="text-gray-500 p-4">Loading claims queue...</p>
  }

  const formatCurrency = (amount: number) => {
    return `$${(amount || 0).toLocaleString()}`
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('court-ready')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'court-ready'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Court Ready ({courtReadyAccounts.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ⚠️ Pending Review ({pendingAccounts.length})
        </button>
        <button
          onClick={() => setActiveTab('active-cases')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'active-cases'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ⚖️ Active Cases ({activeLegalCases.length})
        </button>
      </div>

      {/* Court Ready Accounts */}
      {activeTab === 'court-ready' && (
        <div className="space-y-3">
          {courtReadyAccounts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No accounts ready for court assignment.
            </p>
          ) : (
            courtReadyAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {account.debtorName}
                      </h3>
                      <span className="text-xs text-gray-500">#{account.accountNumber}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Balance:</span>{' '}
                        {formatCurrency(account.currentBalance)}
                      </div>
                      <div>
                        <span className="font-medium">Total Collectable:</span>{' '}
                        {formatCurrency(account.totalCollectable)}
                      </div>
                      <div>
                        <span className="font-medium">Paid:</span>{' '}
                        {formatCurrency(account.paymentsReceived)}
                      </div>
                      {account.suitNo && (
                        <div>
                          <span className="font-medium">Suit No:</span> {account.suitNo}
                        </div>
                      )}
                      {account.courtReceiptNo && (
                        <div>
                          <span className="font-medium">Court Receipt:</span>{' '}
                          {account.courtReceiptNo}
                        </div>
                      )}
                      {account.lodge && (
                        <div>
                          <span className="font-medium">Lodge:</span> {account.lodge}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Location:</span>{' '}
                        {[account.townCity, account.district].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedAgent[account.id] || ''}
                      onChange={(e) =>
                        setSelectedAgent((prev) => ({ ...prev, [account.id]: e.target.value }))
                      }
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                    >
                      <option value="">Select Agent</option>
                      {courtAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(account.id)}
                      disabled={assigning[account.id]}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm whitespace-nowrap"
                    >
                      {assigning[account.id] ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Review */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingAccounts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No accounts pending review.</p>
          ) : (
            pendingAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{account.debtorName}</h3>
                    <p className="text-sm text-gray-500">
                      Balance: {formatCurrency(account.currentBalance)} | Status:{' '}
                      {account.legalStatus || 'pending_review'}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    Pending Review
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Active Cases */}
      {activeTab === 'active-cases' && (
        <div className="space-y-3">
          {activeLegalCases.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active legal cases.</p>
          ) : (
            activeLegalCases.map((legalCase) => (
              <div
                key={legalCase.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Case #{legalCase.caseNumber || legalCase.id}</h3>
                    <p className="text-sm text-gray-500">
                      Status: {legalCase.status} | Court: {legalCase.court || 'N/A'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      legalCase.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : legalCase.status === 'in_court'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {legalCase.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
