import React from 'react'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { headers } from 'next/headers'
import { ToastProvider } from '@/components/Toast'
import Script from 'next/script'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isCrm = pathname.startsWith('/crm')

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={
          isCrm ? 'min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100' : ''
        }
        suppressHydrationWarning
      >
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            })();
          `}
        </Script>
        <ToastProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
