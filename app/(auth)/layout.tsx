import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f8fafc 100%)' }}>

      {/* Animated bg blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.4), transparent 60%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.4), transparent 60%)', filter: 'blur(80px)' }} />
      </div>

      <div className="absolute inset-0 grid-bg grid-bg-mask opacity-50 pointer-events-none" />

      {/* Top nav */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)', boxShadow: '0 4px 14px rgba(79,70,229,0.35)' }}>
            <span className="text-white text-xs font-black">CQ</span>
          </div>
          <span className="font-bold text-text-primary tracking-tight">candiq</span>
        </Link>
        <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Zurück zur Startseite
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16 relative z-10">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </div>
    </div>
  )
}
