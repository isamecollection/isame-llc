'use client'
import { useState } from 'react'

export function CalendarView({
  legalCases,
  scheduledPayments,
  activeRole,
}: {
  legalCases: any[]
  scheduledPayments: any[]
  activeRole: string
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'list'>('month')

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get all court events
  const courtEvents = legalCases.flatMap((c) =>
    (c.courtEvents || []).map((e: any) => ({
      ...e,
      debtorName: c.account?.debtorName || 'Unknown',
      caseNumber: c.caseNumber,
      court: c.court,
      type: 'court',
    })),
  )

  // Get all payment due dates
  const paymentEvents = scheduledPayments.map((p: any) => ({
    eventDate: p.dueDate,
    debtorName: p.account?.debtorName || 'Unknown',
    amount: p.amount,
    type: 'payment',
  }))

  const allEvents = [...courtEvents, ...paymentEvents]

  // Calendar logic
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toDateString()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getEventsForDay = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0]
    return allEvents.filter((e) => e.eventDate?.startsWith(dateStr))
  }

  // List view
  const upcomingEvents = allEvents
    .filter((e) => new Date(e.eventDate) >= new Date())
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 20)

  return (
    <div>
      {/* View Toggle & Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1.5 text-sm rounded-lg ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            📅 Month
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-sm rounded-lg ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            📋 List
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
          >
            ←
          </button>
          <span className="font-semibold">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
          >
            →
          </button>
        </div>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {dayNames.map((d) => (
              <div
                key={d}
                className="p-2 text-center text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-900"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-24 p-1 border-b border-r border-gray-100 dark:border-gray-700"
              />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const events = getEventsForDay(day)
              const isToday = new Date(year, month, day).toDateString() === today

              return (
                <div
                  key={day}
                  className={`min-h-24 p-1 border-b border-r border-gray-100 dark:border-gray-700 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <span
                    className={`text-xs font-semibold ${isToday ? 'bg-blue-600 text-white rounded-full w-5 h-5 inline-flex items-center justify-center' : ''}`}
                  >
                    {day}
                  </span>
                  <div className="space-y-0.5 mt-0.5">
                    {events.slice(0, 3).map((event, idx) => (
                      <div
                        key={idx}
                        className={`text-xs px-1 py-0.5 rounded truncate ${
                          event.type === 'court'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }`}
                      >
                        {event.type === 'court' ? '⚖️' : '💰'} {event.debtorName}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-xs text-gray-400">+{events.length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-2">
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming events.</p>
          ) : (
            upcomingEvents.map((event, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center gap-3"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                    event.type === 'court'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-green-100 dark:bg-green-900/30'
                  }`}
                >
                  {event.type === 'court' ? '⚖️' : '💰'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{event.debtorName}</p>
                  <p className="text-sm text-gray-500">
                    {event.type === 'court' ? (
                      <>
                        Case #{event.caseNumber} • {event.court} • {event.eventType}
                      </>
                    ) : (
                      <>Payment Due • ${event.amount?.toLocaleString()}</>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {new Date(event.eventDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
