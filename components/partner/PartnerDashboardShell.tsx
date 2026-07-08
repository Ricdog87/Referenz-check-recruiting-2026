'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Briefcase, Tag, Image as ImageIcon, LogOut, ShieldCheck, Menu, X, Wallet,
} from 'lucide-react'
import type { PartnerSession } from '@/lib/partner/session'

const NAV = [
  { href: '/partner/dashboard',            label: 'Übersicht',    icon: LayoutDashboard },
  { href: '/partner/dashboard/customers',  label: 'Mandanten',    icon: Briefcase },
  { href: '/partner/dashboard/pricing',    label: 'Konditionen',  icon: Tag },
  { href: '/partner/dashboard/co-brand',   label: 'Co-Branding',  icon: ImageIcon },
  { href: '/partner/dashboard/payouts',    label: 'Abrechnung',   icon: Wallet },
]

const TIER_LABELS: Record<string, string> = {
  REGISTERED: 'Registered',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
}

export function PartnerDashboardShell({
  partner,
  children,
}: {
  partner: PartnerSession
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Drawer beim Navigieren schließen — sonst bleibt er nach einem
  // Link-Klick offen und verdeckt die neue Seite.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    try {
      const csrf = await fetch('/api/auth/partner/csrf').then((r) => r.json())
      const body = new URLSearchParams({ csrfToken: csrf?.csrfToken ?? '', callbackUrl: '/partner/login' })
      await fetch('/api/auth/partner/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        redirect: 'manual',
      })
    } catch {
      /* fallthrough — der harte Redirect fängt's */
    }
    window.location.href = '/partner/login'
  }

  return (
    <div className="min-h-screen bg-bg-secondary flex">
      {/* Sidebar — Desktop ─────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-border-default">
        <SidebarContent partner={partner} pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* Sidebar — Mobile Drawer ───────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white border-r border-border-default flex flex-col">
            <button
              className="absolute top-3 right-3 p-1 text-text-muted hover:text-text-primary"
              onClick={() => setMobileOpen(false)}
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent partner={partner} pathname={pathname} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Main ──────────────────────────────────────────────────────── */}
      <main id="main" className="flex-1 min-w-0 overflow-x-hidden bg-bg-secondary">
        {/* Mobile-Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-border-default">
          <button
            className="p-1.5 text-text-secondary hover:text-text-primary"
            onClick={() => setMobileOpen(true)}
            aria-label="Menü"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-text-primary">Partner-Dashboard</span>
          <div className="w-7" /> {/* Spacer für Center-Align */}
        </div>

        <div className="px-4 sm:px-6 lg:px-10 py-8">{children}</div>
      </main>
    </div>
  )
}

function SidebarContent({
  partner,
  pathname,
  onLogout,
}: {
  partner: PartnerSession
  pathname: string
  onLogout: () => void
}) {
  return (
    <>
      {/* Brand + Co-Brand-Hinweis */}
      <div className="px-5 py-5 border-b border-border-default">
        <Link href="/" className="block">
          <div className="text-base font-bold text-text-primary tracking-tightest">candiq</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wide">Partner-Programm</div>
        </Link>
        <div className="mt-4 p-2.5 rounded-lg bg-indigo-50 border border-indigo-100">
          <div className="text-xs font-semibold text-indigo-900 leading-tight truncate" title={partner.name}>
            {partner.name || partner.email}
          </div>
          <div className="text-[10px] text-indigo-700 mt-0.5 inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Tier: {TIER_LABELS[partner.tier] ?? partner.tier}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const isActive = item.href === '/partner/dashboard'
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ' +
                (isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary')
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-border-default">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-subtle hover:text-text-primary transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Abmelden
        </button>
      </div>
    </>
  )
}
