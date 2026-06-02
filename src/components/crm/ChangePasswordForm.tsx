'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function ChangePasswordForm({ userId }: { userId: string }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState<'current' | 'email'>('current')
  const [emailSent, setEmailSent] = useState(false)
  const { showToast } = useToast()

  // Change password with current password
  async function handleChangeWithCurrent(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/users/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    })
    if (res.ok) {
      showToast('Password changed!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      const data = await res.json().catch(() => ({}))
      showToast(data.error || 'Failed', 'error')
    }
    setSubmitting(false)
  }

  // Send reset email
  async function handleSendResetEmail() {
    setSubmitting(true)
    const res = await fetch('/api/users/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, sendEmail: true }),
    })
    if (res.ok) {
      setEmailSent(true)
      showToast('Reset link sent to your email!')
    } else {
      showToast('Failed to send email', 'error')
    }
    setSubmitting(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Change Password
      </h3>

      {/* Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setMode('current')
            setEmailSent(false)
          }}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            mode === 'current'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          Current Password
        </button>
        <button
          onClick={() => {
            setMode('email')
            setEmailSent(false)
          }}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            mode === 'email'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          Email Reset Link
        </button>
      </div>

      {mode === 'current' ? (
        <form onSubmit={handleChangeWithCurrent} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {submitting ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {emailSent ? (
            <div className="text-center py-4">
              <p className="text-green-600 font-medium">✅ Email sent!</p>
              <p className="text-sm text-gray-500 mt-1">Check your inbox for the reset link.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                We'll send a password reset link to your email address.
              </p>
              <button
                onClick={handleSendResetEmail}
                disabled={submitting}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {submitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
