'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/components/Toaster'
import { HubSpotChatContext } from '@/components/hubspot/HubSpotChatContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
      {process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID && <HubSpotChatContext />}
    </SessionProvider>
  )
}
