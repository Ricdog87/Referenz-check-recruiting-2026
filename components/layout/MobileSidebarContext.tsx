'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type Ctx = { open: boolean; setOpen: (open: boolean) => void; toggle: () => void }
const MobileSidebarContext = createContext<Ctx | null>(null)

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Auto-close on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  return (
    <MobileSidebarContext.Provider value={{ open, setOpen, toggle: () => setOpen((o) => !o) }}>
      {children}
    </MobileSidebarContext.Provider>
  )
}

export function useMobileSidebar() {
  const ctx = useContext(MobileSidebarContext)
  if (!ctx) throw new Error('useMobileSidebar must be inside MobileSidebarProvider')
  return ctx
}
