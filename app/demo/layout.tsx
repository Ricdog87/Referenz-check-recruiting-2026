import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'Live-Demo ohne Anmeldung',
  description:
    'Sehen Sie das candiq-Dashboard live — voll funktionsfähig, ohne Anmeldung. Kandidaten-Pipeline, Reference-Check-Status und Reports mit synthetischen Beispieldaten.',
  path: '/demo',
})

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
