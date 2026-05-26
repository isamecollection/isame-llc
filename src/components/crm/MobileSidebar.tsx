'use client'
import { useState } from 'react'
import Link from 'next/link'

export function MobileSidebar({
  showManagement,
  showSupervisor,
  showReports,
}: {
  showManagement: boolean
  showSupervisor: boolean
  showReports: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-slate-800 text-white"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/90 p-4 flex flex-col space-y-2">
          <button onClick={() => setOpen(false)} className="self-end text-white text-2xl">
            &times;
          </button>
          <Link href="/crm/dashboard" onClick={() => setOpen(false)} className="text-white text-lg">
            📊 Dashboard
          </Link>
          <Link href="/crm/accounts" onClick={() => setOpen(false)} className="text-white text-lg">
            📋 Accounts
          </Link>
          {showManagement && (
            <>
              <Link href="/crm/users" onClick={() => setOpen(false)} className="text-white text-lg">
                👥 Users
              </Link>
              <Link
                href="/crm/clients"
                onClick={() => setOpen(false)}
                className="text-white text-lg"
              >
                🏢 Clients
              </Link>
              <Link
                href="/crm/import"
                onClick={() => setOpen(false)}
                className="text-white text-lg"
              >
                ➕ Add Accounts
              </Link>
            </>
          )}
          {showSupervisor && (
            <Link
              href="/crm/supervisor/users"
              onClick={() => setOpen(false)}
              className="text-white text-lg"
            >
              👥 Manage Team
            </Link>
          )}
          {showReports && (
            <Link href="/crm/reports" onClick={() => setOpen(false)} className="text-white text-lg">
              📊 Reports
            </Link>
          )}
        </div>
      )}
    </>
  )
}
