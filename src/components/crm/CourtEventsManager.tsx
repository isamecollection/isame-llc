'use client'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'

type CourtEvent = {
  id?: string
  eventDate: string
  eventType: string
  notes?: string
  outcome?: string
}

export function CourtEventsManager({ accountId }: { accountId: string }) {
  const [events, setEvents] = useState<CourtEvent[]>([])
  const [caseId, setCaseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [newDate, setNewDate] = useState('')
  const [newType, setNewType] = useState('hearing')
  const [newNotes, setNewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { showToast } = useToast()

  useEffect(() => {
    async function loadCase() {
      const res = await fetch(`/api/legal-cases?where[account][equals]=${accountId}&limit=1`)
      const json = await res.json()
      if (json.docs?.length) {
        const c = json.docs[0]
        setCaseId(c.id)
        setEvents(c.courtEvents || [])
      }
      setLoading(false)
    }
    loadCase()
  }, [accountId])

  async function saveEvents(updated: CourtEvent[]) {
    if (!caseId) return
    setSubmitting(true)
    const res = await fetch(`/api/legal-cases/${caseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courtEvents: updated }),
    })
    if (res.ok) {
      setEvents(updated)
      setNewDate('')
      setNewNotes('')
    } else {
      showToast('Failed to update events', 'error')
    }
    setSubmitting(false)
  }

  function addEvent() {
    if (!newDate) {
      showToast('Date is required', 'error')
      return
    }
    const newEvent: CourtEvent = {
      eventDate: newDate,
      eventType: newType,
      notes: newNotes,
    }
    saveEvents([...events, newEvent])
    showToast('Event added')
  }

  function removeEvent(index: number) {
    const updated = events.filter((_, i) => i !== index)
    saveEvents(updated)
    showToast('Event removed')
  }

  if (loading) return null

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Court Events</h4>

      {events.length === 0 && <p className="text-gray-500 dark:text-gray-400">No events yet.</p>}

      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {events.map((event, idx) => (
          <li key={idx} className="py-2 flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {new Date(event.eventDate).toLocaleDateString()}
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                – {event.eventType}
              </span>
              {event.notes && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  — {event.notes}
                </span>
              )}
              {event.outcome && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  [Outcome: {event.outcome}]
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeEvent(idx)}
              className="text-red-600 dark:text-red-400 hover:underline text-sm"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {/* Add New Event */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
        <h5 className="font-medium">Add New Event</h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="hearing">Hearing</option>
              <option value="trial">Trial</option>
              <option value="deadline">Deadline</option>
              <option value="conference">Conference</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={addEvent}
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Adding…' : 'Add Event'}
        </button>
      </div>
    </div>
  )
}
