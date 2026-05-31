'use client'
import { useState } from 'react'

export function CourtAgentActions({
  accountId,
  processServers,
}: {
  accountId: string
  processServers: any[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [caseNumber, setCaseNumber] = useState('')
  const [court, setCourt] = useState('')
  const [courtDate, setCourtDate] = useState('')
  const [courtTime, setCourtTime] = useState('')
  const [eventType, setEventType] = useState('hearing')
  const [notes, setNotes] = useState('')
  const [processServerId, setProcessServerId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const handleUpdateCourtInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (caseNumber || court) {
        await fetch(`/api/accounts/${accountId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            suitNo: caseNumber || undefined,
            lodge: court || undefined,
          }),
        })
      }

      if (courtDate) {
        const casesRes = await fetch(`/api/legal-cases?where[account][equals]=${accountId}&limit=1`)
        const cases = await casesRes.json()

        if (cases.docs?.length > 0) {
          const caseId = cases.docs[0].id
          const existingEvents = cases.docs[0].courtEvents || []

          await fetch(`/api/legal-cases/${caseId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              caseNumber: caseNumber || cases.docs[0].caseNumber,
              court: court || cases.docs[0].court,
              courtEvents: [
                ...existingEvents,
                {
                  eventDate: courtDate,
                  eventTime: courtTime || undefined,
                  eventType: eventType,
                  notes: notes || undefined,
                },
              ],
            }),
          })
        }
      }

      alert('Court information updated!')
      window.location.reload()
    } catch (error) {
      alert('Failed to update court information')
    }
    setSubmitting(false)
  }

  const handleAssignProcessServer = async () => {
    if (!processServerId) {
      alert('Please select a process server')
      return
    }
    setAssigning(true)
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedProcessServer: processServerId,
          serviceStatus: 'pending_service',
        }),
      })
      if (res.ok) {
        alert('Process server assigned!')
        window.location.reload()
      } else {
        alert('Failed to assign process server')
      }
    } catch {
      alert('Network error')
    }
    setAssigning(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={processServerId}
          onChange={(e) => setProcessServerId(e.target.value)}
          className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm"
        >
          <option value="">Assign Server...</option>
          {processServers.map((ps: any) => (
            <option key={ps.id} value={ps.id}>
              {ps.name || ps.email}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssignProcessServer}
          disabled={assigning || !processServerId}
          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm whitespace-nowrap"
        >
          {assigning ? '...' : 'Assign'}
        </button>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        ⚖️ {showForm ? 'Cancel' : 'Update Court Info & Set Date'}
      </button>

      {showForm && (
        <form
          onSubmit={handleUpdateCourtInfo}
          className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                Case/Suit Number
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="e.g. 530/26"
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                Court/Lodge
              </label>
              <input
                type="text"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                placeholder="e.g. JBW Finance"
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                Court Date *
              </label>
              <input
                type="date"
                value={courtDate}
                onChange={(e) => setCourtDate(e.target.value)}
                required
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                Time
              </label>
              <input
                type="time"
                value={courtTime}
                onChange={(e) => setCourtTime(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
              Event Type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
            >
              <option value="hearing">Hearing</option>
              <option value="mention">Mention</option>
              <option value="trial">Trial</option>
              <option value="mediation">Mediation</option>
              <option value="judgment">Judgment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes..."
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !courtDate}
            className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {submitting ? 'Saving...' : 'Save Court Info'}
          </button>
        </form>
      )}
    </div>
  )
}
