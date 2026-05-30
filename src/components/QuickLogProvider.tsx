'use client'
import { createContext, useContext, useEffect } from 'react'

type PendingLog = {
  accountId: string
  phoneNumber: string
  type: 'call' | 'sms' | 'whatsapp'
  timestamp: string
}

const QuickLogContext = createContext<{
  logAction: (log: PendingLog) => void
}>({ logAction: () => {} })

export function QuickLogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement
      if (!target?.href) return

      let type: PendingLog['type'] | null = null
      if (target.href.startsWith('tel:')) type = 'call'
      else if (target.href.startsWith('sms:')) type = 'sms'
      else if (target.href.includes('wa.me')) type = 'whatsapp'

      if (type) {
        const phone = target.href.replace(/^(tel:|sms:|\/\/wa\.me\/)/, '').split('?')[0]
        const accountId = target.dataset.accountId || ''
        if (accountId && phone) {
          sessionStorage.setItem(
            'pendingLog',
            JSON.stringify({
              accountId,
              phoneNumber: phone,
              type,
              timestamp: new Date().toISOString(),
            }),
          )
        }
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <QuickLogContext.Provider value={{ logAction: () => {} }}>{children}</QuickLogContext.Provider>
  )
}
