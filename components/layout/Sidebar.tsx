'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, ClipboardList, Settings, BarChart3,
  Plug, LogOut, Sparkles, Briefcase, ShoppingBag, ScrollText, X, ChevronRight,
} from 'lucide-react'
import { ACCOUNT_TYPES } from '@/lib/utils'
import { useMobileSidebar } from './MobileSidebarContext'

const NAV_BASE = [
  { href: '/dashboard',   label: 'Übersicht',          icon: LayoutDashboard, badge: null },
  { href: '/candidates',  label: 'Kandidaten',          icon: Users,           badge: null },
  { href: '/checks',      label: 'Referenzprüfungen',   icon: ClipboardList,   badge: null },
  { href: '/analytics',   label: 'Analytics',            icon: BarChart3,       badge: null },
  { href: '/addons',      label: 'Add-ons',              icon: ShoppingBag,     badge: 'NEU' },
]

const NAV_AGENCY_ONLY = [
  { href: '/clients', label: 'Mandanten', icon: Briefcase, badge: null },
]

const NAV_SECONDARY = [
  { href: '/integrations', label: 'Integrationen', icon: Plug,        badge: null },
  { href: '/audit',        label: 'Audit-Trail',   icon: ScrollText,  badge: null },
  { href: '/settings',     label: 'Einstellungen', icon: Settings,    badge: null },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { open, setOpen } = useMobileSidebar()
  const isAgency = session?.user?.accountType === 'RECRUITMENT_AGENCY'
  const nav = [...NAV_BASE, ...(isAgency ? NAV_AGENCY_ONLY : [])]

  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 w-[220px] h-screen flex flex-col flex-shrink-0 bg-[#fafbfc] border-r border-slate-100 transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center px-4 border-b border-slate-100 justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)' }}>
              <span className="text-white text-[11px] font-black tracking-tighter">CQ</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 tracking-tight leading-none">candiq</div>
              <div className="text-[9px] text-slate-400 mt-0.5 truncate leading-none">
                {session?.user?.accountType ? ACCOUNT_TYPES[session.user.accountType as keyof typeof ACCOUNT_TYPES]?.short : ''}
              </div>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <SectionLabel>Workspace</SectionLabel>
          {nav.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}

          <div className="my-3 border-t border-slate-100" />

          <SectionLabel>Konto</SectionLabel>
          {NAV_SECONDARY.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}

          {/* Upgrade card for starter plans */}
          {session?.user?.plan && ['STARTER', 'AGENCY_BASIC'].includes(session.user.plan) && (
            <div className="mt-4 px-1">
              <div className="rounded-xl p-3.5 text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                <Sparkles className="w-4 h-4 mb-2 text-amber-300" />
                <div className="text-xs font-bold mb-1">Upgrade verfügbar</div>
                <p className="text-[10px] text-white/75 leading-relaxed mb-2.5">
                  Mehr Checks, ATS-Integration, Multi-Workspace.
                </p>
                <Link href="/preise"
                  className="block text-center text-[11px] font-bold py-1.5 rounded-lg bg-white text-indigo-700 hover:bg-slate-50 transition-colors">
                  Jetzt upgraden
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white shadow-sm">
              {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-700 truncate leading-tight">{session?.user?.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{session?.user?.email}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              title="Abmelden"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1 pt-2">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.12em]">{children}</span>
    </div>
  )
}

function NavItem({ href, label, icon: Icon, badge, pathname }: { href: string; label: string; icon: any; badge: string | null; pathname: string }) {
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
        active
          ? 'bg-indigo-50 text-indigo-700 font-semibold'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'}`} />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-700">{badge}</span>
      )}
      {active && <ChevronRight className="w-3 h-3 text-indigo-400 opacity-60" />}
    </Link>
  )
}
