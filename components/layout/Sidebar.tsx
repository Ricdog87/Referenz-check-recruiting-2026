'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, ClipboardList, Settings, BarChart3,
  Plug, LogOut, Sparkles, Briefcase, ShoppingBag, ScrollText, X,
  CreditCard, ShieldCheck, ShieldHalf, UserCircle2,
} from 'lucide-react'
import { ACCOUNT_TYPES } from '@/lib/utils'
import { useMobileSidebar } from './MobileSidebarContext'

// Kunden-Navigation (CLIENT-Role): die ueblichen HR-Workspace-Features.
const NAV_CLIENT_BASE = [
  { href: '/dashboard', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/candidates', label: 'Kandidaten', icon: Users },
  { href: '/checks', label: 'Referenzprüfungen', icon: ClipboardList },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/addons', label: 'Add-ons', icon: ShoppingBag },
]

// Nur für RECRUITMENT_AGENCY: Mandanten-Liste (Roadmap, aber Page existiert).
const NAV_AGENCY_ONLY = [
  { href: '/clients', label: 'Mandanten', icon: Briefcase },
]

// Kunden-Konto-Sektion. Wird NICHT für ADMIN/REVIEWER gerendert — die haben
// keinen Kundenplan und keine Add-ons.
const NAV_CLIENT_ACCOUNT = [
  { href: '/integrations', label: 'Integrationen', icon: Plug },
  { href: '/audit', label: 'Audit-Trail', icon: ScrollText },
  { href: '/settings', label: 'Einstellungen', icon: Settings },
  { href: '/settings/billing', label: 'Abrechnung', icon: CreditCard },
]

// candiq-interne Navigation. ADMIN bekommt zusätzlich das Cockpit (KPIs/MRR
// aus PR #128) und die Kundenverwaltung. REVIEWER nur Review-Sektion.
const NAV_REVIEW = [
  { href: '/reviewer', label: 'Reviewer-Dashboard', icon: ShieldHalf },
  { href: '/reviewer/queue', label: 'Reviewer-Queue', icon: ShieldCheck },
]

const NAV_ADMIN = [
  { href: '/admin', label: 'Cockpit', icon: LayoutDashboard },
  { href: '/admin/customers', label: 'Kundenverwaltung', icon: Users },
  { href: '/audit', label: 'Audit-Trail', icon: ScrollText },
]

const NAV_INTERNAL_ACCOUNT = [
  { href: '/settings', label: 'Einstellungen', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { open, setOpen } = useMobileSidebar()

  const role = session?.user?.role
  const isAdmin = role === 'ADMIN'
  const isReviewer = role === 'REVIEWER' || role === 'ADMIN'
  const isAgency = session?.user?.accountType === 'RECRUITMENT_AGENCY'
  const isInternal = isReviewer // ADMIN + REVIEWER bekommen die candiq-interne Shell

  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 w-60 h-screen flex flex-col flex-shrink-0 bg-white border-r border-border transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo + Role-Indikator */}
        <div className="h-16 flex items-center px-5 border-b border-border justify-between">
          <Link
            href={isInternal ? (isAdmin ? '/admin' : '/reviewer') : '/dashboard'}
            className="flex items-center gap-2.5 group"
            aria-label="candiq Startseite"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" width={32} height={32} className="w-8 h-8" />
            <div className="min-w-0">
              <div className="text-sm font-bold text-text-primary tracking-tight">candiq</div>
              <div className="text-[10px] text-text-muted truncate">
                {isAdmin
                  ? 'Admin · intern'
                  : role === 'REVIEWER'
                  ? 'Reviewer · intern'
                  : session?.user?.accountType
                  ? ACCOUNT_TYPES[session.user.accountType as keyof typeof ACCOUNT_TYPES]?.short
                  : ''}
              </div>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary"
            aria-label="Menü schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav — getrennte Shells für Kunde vs. candiq-intern */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {isInternal ? (
            // ── candiq-interne Shell (ADMIN/REVIEWER) ─────────────────
            <>
              {isAdmin && (
                <NavSection label="Admin · intern" accent="rose">
                  {NAV_ADMIN.map((item) => (
                    <NavItem key={item.href} {...item} pathname={pathname} />
                  ))}
                </NavSection>
              )}
              <NavSection label="Review" accent="brand">
                {NAV_REVIEW.map((item) => (
                  <NavItem key={item.href} {...item} pathname={pathname} />
                ))}
              </NavSection>
              <NavSection label="Konto">
                {NAV_INTERNAL_ACCOUNT.map((item) => (
                  <NavItem key={item.href} {...item} pathname={pathname} />
                ))}
              </NavSection>
            </>
          ) : (
            // ── Kunden-Shell (CLIENT) ─────────────────────────────────
            <>
              <NavSection label="Workspace">
                {NAV_CLIENT_BASE.map((item) => (
                  <NavItem key={item.href} {...item} pathname={pathname} />
                ))}
                {isAgency &&
                  NAV_AGENCY_ONLY.map((item) => (
                    <NavItem key={item.href} {...item} pathname={pathname} />
                  ))}
              </NavSection>

              <NavSection label="Konto">
                {NAV_CLIENT_ACCOUNT.map((item) => (
                  <NavItem key={item.href} {...item} pathname={pathname} />
                ))}
              </NavSection>

              {/* Upgrade-Card nur für Kunden mit Starter/AgencyBasic */}
              {session?.user?.plan && (session.user.plan === 'STARTER' || session.user.plan === 'AGENCY_BASIC') && (
                <div className="mt-6 px-3">
                  <div
                    className="rounded-2xl p-4 text-white relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)' }}
                  >
                    <Sparkles className="w-5 h-5 mb-2 text-amber-300" />
                    <div className="text-xs font-bold mb-1">Upgrade verfügbar</div>
                    <p className="text-[11px] text-white/80 leading-relaxed mb-3">
                      Mehr Prüfungen, ATS-Integration, Multi-Workspaces.
                    </p>
                    <Link
                      href="/preise"
                      className="block w-full text-center text-xs font-semibold py-1.5 rounded-full bg-white text-brand-700 hover:bg-bg-secondary transition-colors"
                    >
                      Upgraden
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-bg-secondary transition-colors group cursor-default">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-card ${
                isAdmin
                  ? 'bg-gradient-to-br from-rose-500 to-rose-700'
                  : role === 'REVIEWER'
                  ? 'bg-gradient-to-br from-brand-500 to-brand-700'
                  : 'bg-gradient-to-br from-brand-500 to-violet'
              }`}
            >
              {session?.user?.name?.[0]?.toUpperCase() ?? <UserCircle2 className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-text-primary truncate">
                {session?.user?.name}
                {isAdmin && (
                  <span className="ml-1 px-1 py-0 rounded text-[9px] font-bold bg-rose-100 text-rose-700 align-middle">
                    ADMIN
                  </span>
                )}
                {role === 'REVIEWER' && (
                  <span className="ml-1 px-1 py-0 rounded text-[9px] font-bold bg-brand-100 text-brand-700 align-middle">
                    REVIEWER
                  </span>
                )}
              </div>
              <div className="text-[10px] text-text-muted truncate">{session?.user?.email}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-rose-50"
              title="Abmelden"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function NavSection({
  label,
  accent,
  children,
}: {
  label: string
  accent?: 'rose' | 'brand'
  children: React.ReactNode
}) {
  const accentClass =
    accent === 'rose'
      ? 'text-rose-600'
      : accent === 'brand'
      ? 'text-brand-600'
      : 'text-text-muted'
  return (
    <div className="mb-1">
      <div className="px-3 pb-1.5 pt-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${accentClass}`}>
          {label}
        </span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function NavItem({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string
  label: string
  icon: any
  pathname: string
}) {
  // /settings nur bei exakter Übereinstimmung aktiv — /settings/billing hat
  // einen eigenen Nav-Eintrag und würde sonst beide gleichzeitig markieren.
  // Analog /reviewer (Dashboard) vs. /reviewer/queue und /admin vs. /admin/customers.
  const exactOnly = ['/dashboard', '/settings', '/reviewer', '/admin']
  const active =
    pathname === href ||
    (!exactOnly.includes(href) && pathname.startsWith(href + '/'))
  return (
    <Link href={href} className={active ? 'nav-item-active' : 'nav-item'}>
      <Icon className={`w-4 h-4 ${active ? 'text-brand-600' : 'text-text-muted'}`} />
      <span>{label}</span>
    </Link>
  )
}
