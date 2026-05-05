'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/components/Toaster'
import { CookieConsent } from '@/components/CookieConsent'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
      <CookieConsent />
    </SessionProvider>
  )
}
