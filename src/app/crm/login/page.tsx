'use client'
import { useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle' // 👈 import the toggle

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })

    if (!res.ok) {
      alert('Login failed')
      setSubmitting(false)
      return
    }

    try {
      const userRes = await fetch('/api/users/me', { credentials: 'include' })
      if (userRes.ok) {
        const user = await userRes.json()
        const roles: string[] = user.roles || []
        const crmRoles = roles.filter((r) =>
          ['collector', 'crm-manager', 'supervisor', 'admin'].includes(r),
        )
        const defaultRole = crmRoles.length > 0 ? crmRoles[0] : 'collector'
        document.cookie = `activeRole=${defaultRole}; path=/crm; SameSite=Lax`
      }
    } catch {}

    window.location.href = '/crm/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-950 px-4 relative">
      {/* Toggle in the top‑right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Isame Collection</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Sign in to your CRM dashboard</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleLogin}
          className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 space-y-6"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Secure access · Authorized personnel only
        </p>
      </div>
    </div>
  )
}
