import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Minimal nav */}
      <div className="flex items-center justify-center pt-10 pb-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-xl bg-accent flex items-center justify-center"
            style={{ boxShadow: '0 0 16px rgba(10,132,255,0.35)' }}>
            <span className="text-white text-xs font-bold">RC</span>
          </div>
          <span className="font-semibold text-white/80 group-hover:text-white transition-colors text-sm">RefCheck</span>
        </Link>
      </div>

      {/* Background glow */}
      <div className="flex-1 flex items-start justify-center px-4 pb-16 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(10,132,255,0.08) 0%, transparent 70%)' }} />
        <div className="w-full max-w-[380px] relative z-10">
          {children}
        </div>
      </div>
    </div>
  )
}
