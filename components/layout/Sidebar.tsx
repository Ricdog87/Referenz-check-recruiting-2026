'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, ClipboardList, Settings, BarChart3,
  Plug, LogOut, ChevronUp, Sparkles, Briefcase,
} from 'lucide-react'
import { ACCOUNT_TYPES } from '@/lib/utils'

const NAV_BASE = [
  { href: '/dashboard', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/candidates', label: 'Kandidaten', icon: Users },
  { href: '/checks', label: 'Referenzprüfungen', icon: ClipboardList },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

const NAV_AGENCY_ONLY = [
  { href: '/clients', label: 'Mandanten', icon: Briefcase },
]

const NAV_INTEGRATIONS = [
  { href: '/integrations', label: 'Integrationen', icon: Plug },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAgency = session?.user?.accountType === 'RECRUITMENT_AGENCY'

  const nav = [
    ...NAV_BASE,
    ...(isAgency ? NAV_AGENCY_ONLY : []),
  ]

  return (
    <aside className="w-60 min-h-screen flex flex-col flex-shrink-0 bg-white border-r border-border sticky top-0 h-screen">

      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}>
            <span className="text-white text-xs font-black">RC</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-text-primary tracking-tight">RefCheck</div>
            <div className="text-[10px] text-text-muted truncate">
              {session?.user?.accountType ? ACCOUNT_TYPES[session.user.accountType as keyof typeof ACCOUNT_TYPES]?.short : ''}
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NavSection label="Workspace">
          {nav.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}
        </NavSection>

        <NavSection label="Konto">
          {NAV_INTEGRATIONS.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}
          <NavItem href="/settings" label="Einstellungen" icon={Settings} pathname={pathname} />
        </NavSection>

        {/* Upgrade card */}
        {session?.user?.plan && (session.user.plan === 'STARTER' || session.user.plan === 'AGENCY_BASIC') && (
          <div className="mt-6 px-3">
            <div className="rounded-2xl p-4 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)' }}>
              <Sparkles className="w-5 h-5 mb-2 text-amber-300" />
              <div className="text-xs font-bold mb-1">Upgrade verfügbar</div>
              <p className="text-[11px] text-white/80 leading-relaxed mb-3">
                Mehr Prüfungen, ATS-Integration, Multi-Workspaces.
              </p>
              <Link href="/preise" className="block w-full text-center text-xs font-semibold py-1.5 rounded-full bg-white text-brand-700 hover:bg-bg-secondary transition-colors">
                Upgraden
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-bg-secondary transition-colors group cursor-default">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-violet flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-card">
            {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-text-primary truncate">{session?.user?.name}</div>
            <div className="text-[10px] text-text-muted truncate">{session?.user?.email}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-rose-50"
            title="Abmelden">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="px-3 pb-1.5 pt-3">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function NavItem({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: any; pathname: string }) {
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
  return (
    <Link href={href} className={active ? 'nav-item-active' : 'nav-item'}>
      <Icon className={`w-4 h-4 ${active ? 'text-brand-600' : 'text-text-muted'}`} />
      <span>{label}</span>
    </Link>
  )
}
