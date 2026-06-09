import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'

export const metadata: Metadata = pageMeta({
  title: 'PDL-Warteliste für Personaldienstleister',
  description:
    'candiq-Pakete für Personaldienstleister mit Multi-Mandanten-Setup, White-Label-Reports und API-Anbindung sind in Vorbereitung. Tragen Sie sich für frühen Zugang ein.',
  path: '/waitlist-agency',
})

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return children
}
