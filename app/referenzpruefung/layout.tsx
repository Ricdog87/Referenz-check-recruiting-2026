import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function ReferenzpruefungLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden antialiased">
      <LandingNav />
      <main id="main" className="pt-16">
        {children}
      </main>
      <LandingFooter />
    </div>
  )
}
