import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  breadcrumb?: { label: string; href: string }[]
}

export function Header({ title, subtitle, action, breadcrumb }: HeaderProps) {
  return (
    <div className="flex items-center justify-between pb-6">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {breadcrumb.map((b, i) => (
              <span key={b.href} className="flex items-center gap-1 text-[11px] text-slate-400">
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                <Link href={b.href} className="hover:text-slate-600 transition-colors">{b.label}</Link>
              </span>
            ))}
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-[11px] font-semibold text-slate-600">{title}</span>
          </div>
        )}
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}
