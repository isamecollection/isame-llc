'use client'

import { usePWAInstall } from '@/hooks/usePWAInstall'

export function PWAInstallButton() {
  const { isInstallable, isStandalone, install } = usePWAInstall()

  // Don't show if already installed as PWA or not installable
  if (isStandalone || !isInstallable) return null

  return (
    <button
      onClick={install}
      className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
    >
      📲 Install App
    </button>
  )
}
