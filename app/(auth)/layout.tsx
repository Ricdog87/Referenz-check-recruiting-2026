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
        <Link href="/" className="flex items-center group" aria-label="candiq Startseite">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="candiq" width={120} height={32} className="h-8 w-auto" />
        </Link>
        <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Zurück zur Startseite
        </Link>
      </div>

      <main id="main" className="flex-1 flex items-center justify-center px-4 pb-16 relative z-10">
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </main>
    </div>
  )
}
