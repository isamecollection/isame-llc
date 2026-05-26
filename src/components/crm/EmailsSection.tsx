'use client'
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/Toast'
import { TemplateSelector } from '@/components/crm/TemplateSelector'

export function EmailsSection({ accountId }: { accountId: string }) {
  const [emails, setEmails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [fetchingMail, setFetchingMail] = useState(false)

  // Send form
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  // Received form
  const [from, setFrom] = useState('')
  const [rSubject, setRSubject] = useState('')
  const [rBody, setRBody] = useState('')
  const [logging, setLogging] = useState(false)

  const { showToast } = useToast()

  const fetchEmails = useCallback(
    async (pageNum = 1, append = false) => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/emails?where[account][equals]=${accountId}&sort=-createdAt&limit=10&page=${pageNum}&depth=1`,
        )
        const data = await res.json()
        if (append) {
          setEmails((prev) => [...prev, ...(data.docs || [])])
        } else {
          setEmails(data.docs || [])
        }
        setHasMore(data.hasNextPage || false)
        setPage(pageNum)
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    },
    [accountId],
  )

  useEffect(() => {
    fetchEmails(1)
  }, [fetchEmails])

  const loadMore = () => {
    if (!hasMore) return
    fetchEmails(page + 1, true)
  }

  // Send email
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!to || !subject || !body) return showToast('All fields are required', 'error')
    setSending(true)
    const res = await fetch('/api/communications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, to, subject, body }),
    })
    if (res.ok) {
      setTo('')
      setSubject('')
      setBody('')
      showToast('Email sent!')
      fetchEmails(1) // refresh from page 1
    } else {
      const err = await res.json()
      showToast('Failed to send email: ' + (err.error || 'Unknown error'), 'error')
    }
    setSending(false)
  }

  // Log received email
  const handleLogReceived = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!from || !rSubject || !rBody) return showToast('All fields are required', 'error')
    setLogging(true)
    const res = await fetch('/api/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: accountId,
        direction: 'received',
        recipient: from,
        subject: rSubject,
        body: rBody,
        status: 'sent', // placeholder
      }),
    })
    if (res.ok) {
      setFrom('')
      setRSubject('')
      setRBody('')
      showToast('Reply logged')
      fetchEmails(1)
    } else {
      showToast('Failed to log reply', 'error')
    }
    setLogging(false)
  }

  // Manual IMAP fetch
  const handleFetchMail = async () => {
    setFetchingMail(true)
    try {
      const res = await fetch('/api/cron/fetch-replies', {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}` },
      })
      const data = await res.json()
      showToast(data.processed ? `Fetched ${data.processed} new replies.` : 'No new mail found.')
      fetchEmails(1)
    } catch (err) {
      showToast('Failed to fetch mail', 'error')
    }
    setFetchingMail(false)
  }

  return (
    <div className="space-y-6">
      {/* Send Email form */}
      <form
        onSubmit={handleSend}
        className="space-y-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
      >
        <h4 className="font-semibold">Send Email</h4>
        <TemplateSelector
          onSelect={({ subject: s, body: b }: { subject: string; body: string }) => {
            setSubject(s)
            setBody(b)
          }}
        />
        <input
          type="email"
          placeholder="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <textarea
          rows={4}
          placeholder="Message"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y"
        />
        <button
          type="submit"
          disabled={sending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {sending ? 'Sending…' : 'Send Email'}
        </button>
      </form>

      {/* Log Received form */}
      <form
        onSubmit={handleLogReceived}
        className="space-y-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
      >
        <h4 className="font-semibold">Log Received Email</h4>
        <input
          placeholder="From (sender email)"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          placeholder="Subject"
          value={rSubject}
          onChange={(e) => setRSubject(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <textarea
          rows={4}
          placeholder="Paste the reply content here…"
          value={rBody}
          onChange={(e) => setRBody(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y"
        />
        <button
          type="submit"
          disabled={logging}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {logging ? 'Logging…' : 'Log Reply'}
        </button>
      </form>

      {/* Manual fetch & history */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">History</h4>
        <button
          onClick={handleFetchMail}
          disabled={fetchingMail}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {fetchingMail ? 'Checking…' : 'Check for New Mail'}
        </button>
      </div>

      {loading && emails.length === 0 ? (
        <p className="text-gray-500">Loading…</p>
      ) : emails.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No emails yet.</p>
      ) : (
        <>
          <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {emails.map((email: any) => (
                <div key={email.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">
                        {email.direction === 'sent' ? 'Sent' : 'Received'}
                      </span>
                      <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">
                        {email.direction === 'sent'
                          ? `To: ${email.recipient}`
                          : `From: ${email.recipient}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{email.subject}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(email.createdAt).toLocaleString()} by{' '}
                        {(email.sentBy as any)?.name || 'System'}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        email.status === 'sent'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {email.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="text-sm text-blue-600 hover:underline disabled:opacity-50"
              >
                {loading ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
