'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/components/Toaster'
import { APP_ACCESS_OPEN } from '@/lib/site'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // App-Zugang geschlossen: `session={null}` heißt „nicht eingeloggt" und
    // spart den /api/auth/session-Request, den next-auth sonst auf jeder
    // Seite absetzt.
    <SessionProvider session={APP_ACCESS_OPEN ? undefined : null}>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  )
}
